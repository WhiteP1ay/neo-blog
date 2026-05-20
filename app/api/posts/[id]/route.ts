import { eq, inArray, type SQL } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postTypesTable, postsTable } from '@/server/db/schema';
import { markdownToHTML } from '@/server/utils/markdown';
import { stripLeadingTypeLikePrefixes } from '@/lib/strip-post-title-prefixes';
import { stripLeadingDecorationsFromFirstH1InHtml } from '@/server/utils/post-ai-translation-html';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import { getSession, requireAdminSession } from '@/server/utils/auth';
import { parseTypeIdsField } from '@/server/utils/parse-type-ids';
import { loadTypesByPostIds, replacePostTypeAssignments, type PostTypeRow } from '@/server/utils/post-type-assignments';
import { buildPostSearchIndexFields } from '@/server/utils/post-search-index';

type UpdatePostBody = {
  title?: unknown;
  content?: unknown;
  typeIds?: unknown;
  isHidden?: unknown;
  isPinned?: unknown;
  coverUrl?: unknown;
  excerpt?: unknown;
};

function summarizeTypes(rows: PostTypeRow[]) {
  return rows.map((t) => ({
    id: t.id,
    code: t.code,
    nameZh: t.nameZh,
    nameEn: t.nameEn,
  }));
}

async function assertTypeIdsValid(ids: number[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const rows = await db.select({ id: postTypesTable.id }).from(postTypesTable).where(inArray(postTypesTable.id, ids));
  return rows.length === ids.length;
}

function parseId(rawId: string): number | null {
  const parsed = Number.parseInt(rawId, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const postId = parseId(id);
    if (postId == null) {
      return NextResponse.json({ error: '无效的文章 ID' }, { status: 400 });
    }

    const post = await db.query.postsTable.findFirst({
      where: (posts, { eq: eqFn }) => eqFn(posts.id, postId),
    });
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error('获取文章详情失败:', error);
    return NextResponse.json({ error: '获取文章详情失败' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.error === '未登录' ? 401 : 403 });
  }

  try {
    const { id } = await params;
    const postId = parseId(id);
    if (postId == null) {
      return NextResponse.json({ error: '无效的文章 ID' }, { status: 400 });
    }

    const body = (await request.json()) as UpdatePostBody;
    const typeIdsParsed = parseTypeIdsField(body.typeIds);
    if (typeIdsParsed !== 'omit' && !typeIdsParsed.ok) {
      return NextResponse.json({ error: 'typeIds 无效' }, { status: 400 });
    }
    if (typeIdsParsed !== 'omit' && !(await assertTypeIdsValid(typeIdsParsed.ids))) {
      return NextResponse.json({ error: '存在无效的类型 id' }, { status: 400 });
    }

    const current = await db.query.postsTable.findFirst({
      where: (posts, { eq: eqFn }) => eqFn(posts.id, postId),
    });
    if (!current) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    const updatePayload: Omit<Partial<typeof postsTable.$inferInsert>, 'searchVector'> & {
      searchVector?: SQL;
    } = {
      updatedAt: new Date(),
    };

    if (typeof body.title === 'string') {
      const title = stripLeadingTypeLikePrefixes(body.title.trim());
      if (!title) {
        return NextResponse.json({ error: 'title 不能为空' }, { status: 400 });
      }
      updatePayload.title = title;
    }

    const nextMarkdown = typeof body.content === 'string' ? body.content : (current.markdownContent ?? null);
    const nextHtmlRaw = typeof body.content === 'string' ? markdownToHTML(body.content) : current.content;
    const nextHtml =
      typeof body.content === 'string' ? stripLeadingDecorationsFromFirstH1InHtml(nextHtmlRaw) : nextHtmlRaw;
    if (typeof body.content === 'string') {
      if (!body.content.trim()) {
        return NextResponse.json({ error: 'content 不能为空' }, { status: 400 });
      }
      updatePayload.markdownContent = body.content;
      updatePayload.content = nextHtml;
    }

    if (typeof body.isHidden === 'boolean') {
      updatePayload.isHidden = body.isHidden;
    }
    if (typeof body.isPinned === 'boolean') {
      updatePayload.isPinned = body.isPinned;
    }
    if (typeof body.coverUrl === 'string') {
      updatePayload.coverUrl = body.coverUrl.trim() || null;
    }
    if (typeof body.excerpt === 'string') {
      updatePayload.excerpt = body.excerpt.trim() || '';
    }

    const metadata = derivePostMetadata({
      markdownContent: nextMarkdown,
      content: nextHtml,
    });

    if (body.coverUrl === undefined) {
      updatePayload.coverUrl = metadata.coverUrl;
    }
    if (body.excerpt === undefined) {
      updatePayload.excerpt = metadata.excerpt;
    }

    if (typeof body.title === 'string' || typeof body.content === 'string') {
      const title = updatePayload.title ?? current.title;
      const searchIndex = buildPostSearchIndexFields(title, nextMarkdown);
      updatePayload.plainBody = searchIndex.plainBody;
      updatePayload.searchVector = searchIndex.searchVector;
    }

    const willUpdateAssignments = typeIdsParsed !== 'omit';
    const columnKeys = Object.keys(updatePayload).filter((k) => k !== 'updatedAt');
    if (columnKeys.length === 0 && !willUpdateAssignments) {
      return NextResponse.json({ error: '未提供可更新字段' }, { status: 400 });
    }

    const updated = await db.update(postsTable).set(updatePayload).where(eq(postsTable.id, postId)).returning();

    if (!updated[0]) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    if (willUpdateAssignments) {
      await replacePostTypeAssignments(db, postId, typeIdsParsed.ids);
    }

    const fresh = await db.query.postsTable.findFirst({
      where: (posts, { eq: eqFn }) => eqFn(posts.id, postId),
    });
    if (!fresh) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }
    const typeMap = await loadTypesByPostIds(db, [postId]);
    return NextResponse.json({
      data: {
        ...fresh,
        types: summarizeTypes(typeMap.get(postId) ?? []),
      },
    });
  } catch (error) {
    console.error('更新文章失败:', error);
    return NextResponse.json({ error: '更新文章失败' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.error === '未登录' ? 401 : 403 });
  }

  try {
    const { id } = await params;
    const postId = parseId(id);
    if (postId == null) {
      return NextResponse.json({ error: '无效的文章 ID' }, { status: 400 });
    }

    const deleted = await db.delete(postsTable).where(eq(postsTable.id, postId)).returning({ id: postsTable.id });
    if (!deleted[0]) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文章失败:', error);
    return NextResponse.json({ error: '删除文章失败' }, { status: 500 });
  }
}
