import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { commentsTable, postTypesTable, postsTable } from '@/server/db/schema';
import { stripLeadingTypeLikePrefixes } from '@/lib/strip-post-title-prefixes';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import {
  extractFirstH1PlainText,
  stripLeadingDecorationsFromFirstH1InHtml,
} from '@/server/utils/post-ai-translation-html';
import { parseTypeIdsField } from '@/server/utils/parse-type-ids';
import { loadTypesByPostIds, replacePostTypeAssignments, type PostTypeRow } from '@/server/utils/post-type-assignments';
import { requireAdmin } from '@/server/utils/require-admin';
import { buildPostSearchIndexFields } from '@/server/utils/post-search-index';

type UpdatePostBody = {
  title?: unknown;
  titleEn?: unknown;
  content?: unknown;
  contentEn?: unknown;
  markdownContent?: unknown;
  excerpt?: unknown;
  excerptEn?: unknown;
  coverUrl?: unknown;
  typeIds?: unknown;
  isHidden?: unknown;
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

function parseId(id: string): number | null {
  const value = Number.parseInt(id, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

/**
 * 取单篇博文完整数据（含 content / markdownContent），供 admin 编辑场景按需获取。
 * 列表接口为减小体积已移除大字段，编辑时调用本接口拉详情。
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const postId = parseId(id);
  if (!postId) {
    return NextResponse.json({ error: '无效博文ID' }, { status: 400 });
  }

  const post = await db.query.postsTable.findFirst({
    where: (table, { eq: eqFn }) => eqFn(table.id, postId),
  });
  if (!post) {
    return NextResponse.json({ error: '博文不存在' }, { status: 404 });
  }
  const typeMap = await loadTypesByPostIds(db, [postId]);
  return NextResponse.json({
    data: {
      ...post,
      types: summarizeTypes(typeMap.get(postId) ?? []),
    },
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const postId = parseId(id);
  if (!postId) {
    return NextResponse.json({ error: '无效博文ID' }, { status: 400 });
  }

  const body = (await request.json()) as UpdatePostBody;
  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  const hasContentUpdate = typeof body.content === 'string';
  const hasMarkdownUpdate = typeof body.markdownContent === 'string';
  const hasManualExcerpt = typeof body.excerpt === 'string';
  const hasManualCover = typeof body.coverUrl === 'string';

  const hasManualExcerptEn = typeof body.excerptEn === 'string';

  if (typeof body.title === 'string') {
    const title = stripLeadingTypeLikePrefixes(body.title.trim());
    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }
    updatePayload.title = title;
  }
  if (typeof body.titleEn === 'string') {
    const t = stripLeadingTypeLikePrefixes(body.titleEn.trim());
    updatePayload.titleEn = t.length > 0 ? t : null;
  }
  if (typeof body.content === 'string') {
    if (!body.content.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }
    updatePayload.content = stripLeadingDecorationsFromFirstH1InHtml(body.content.trim());
  }
  if (typeof body.markdownContent === 'string') updatePayload.markdownContent = body.markdownContent;
  if (typeof body.contentEn === 'string') {
    const c = body.contentEn.trim();
    updatePayload.contentEn = c.length > 0 ? stripLeadingDecorationsFromFirstH1InHtml(c) : null;
    if (c.length > 0) {
      const normalizedEn = updatePayload.contentEn as string;
      const h1En = extractFirstH1PlainText(normalizedEn);
      if (typeof body.titleEn !== 'string') {
        const stripped = h1En ? stripLeadingTypeLikePrefixes(h1En) : '';
        updatePayload.titleEn = stripped.length > 0 ? stripped : null;
      }
      if (!hasManualExcerptEn) {
        updatePayload.excerptEn =
          derivePostMetadata({
            content: normalizedEn,
            markdownContent: null,
          }).excerpt ?? null;
      }
    } else {
      updatePayload.contentEn = null;
      updatePayload.excerptEn = null;
      if (typeof body.titleEn !== 'string') {
        updatePayload.titleEn = null;
      }
    }
  }
  if (typeof body.excerpt === 'string') updatePayload.excerpt = body.excerpt;
  if (typeof body.excerptEn === 'string') updatePayload.excerptEn = body.excerptEn;
  if (typeof body.coverUrl === 'string') updatePayload.coverUrl = body.coverUrl;
  if (typeof body.isHidden === 'boolean') updatePayload.isHidden = body.isHidden;

  const typeIdsParsed = parseTypeIdsField(body.typeIds);
  if (typeIdsParsed !== 'omit' && !typeIdsParsed.ok) {
    return NextResponse.json({ error: 'typeIds 须为正整数数组' }, { status: 400 });
  }
  if (typeIdsParsed !== 'omit' && !(await assertTypeIdsValid(typeIdsParsed.ids))) {
    return NextResponse.json({ error: '存在无效的类型 id' }, { status: 400 });
  }

  if (hasContentUpdate || hasMarkdownUpdate) {
    const metadata = derivePostMetadata({
      content: hasContentUpdate ? (updatePayload.content as string) : null,
      markdownContent: hasMarkdownUpdate ? (body.markdownContent as string) : null,
    });
    if (!hasManualExcerpt) {
      updatePayload.excerpt = metadata.excerpt;
    }
    if (!hasManualCover) {
      updatePayload.coverUrl = metadata.coverUrl;
    }
  }

  if (typeof body.title === 'string' || hasContentUpdate || hasMarkdownUpdate) {
    const existing = await db.query.postsTable.findFirst({
      where: (posts, { eq: eqFn }) => eqFn(posts.id, postId),
    });
    if (!existing) {
      return NextResponse.json({ error: '博文不存在' }, { status: 404 });
    }
    const title =
      typeof body.title === 'string' ? (updatePayload.title as string) : existing.title;
    const markdown = hasMarkdownUpdate
      ? (body.markdownContent as string)
      : existing.markdownContent;
    const searchIndex = buildPostSearchIndexFields(title, markdown);
    updatePayload.plainBody = searchIndex.plainBody;
    updatePayload.searchVector = searchIndex.searchVector;
  }

  // returning 仅回元字段，避免把刚保存的整段 HTML 再回传前端浪费一次 RTT。
  const updated = await db.update(postsTable).set(updatePayload).where(eq(postsTable.id, postId)).returning({
    id: postsTable.id,
    title: postsTable.title,
    titleEn: postsTable.titleEn,
    sortOrder: postsTable.sortOrder,
    isHidden: postsTable.isHidden,
    isPinned: postsTable.isPinned,
    coverUrl: postsTable.coverUrl,
    excerpt: postsTable.excerpt,
    excerptEn: postsTable.excerptEn,
    updatedAt: postsTable.updatedAt,
  });

  if (!updated[0]) {
    return NextResponse.json({ error: '博文不存在' }, { status: 404 });
  }

  if (typeIdsParsed !== 'omit') {
    await replacePostTypeAssignments(db, postId, typeIdsParsed.ids);
  }

  const typeMap = await loadTypesByPostIds(db, [postId]);
  return NextResponse.json({
    data: {
      ...updated[0],
      types: summarizeTypes(typeMap.get(postId) ?? []),
    },
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const postId = parseId(id);
  if (!postId) {
    return NextResponse.json({ error: '无效博文ID' }, { status: 400 });
  }

  await db.delete(commentsTable).where(and(eq(commentsTable.targetType, 'post'), eq(commentsTable.targetId, postId)));

  const deleted = await db.delete(postsTable).where(eq(postsTable.id, postId)).returning({ id: postsTable.id });
  if (!deleted[0]) {
    return NextResponse.json({ error: '博文不存在' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
