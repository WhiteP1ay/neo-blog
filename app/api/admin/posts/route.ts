import { asc, desc, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postTypesTable, postsTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';
import { markdownToHTML } from '@/server/utils/markdown';
import { stripLeadingDecorationsFromFirstH1InHtml } from '@/server/utils/post-ai-translation-html';
import { stripLeadingTypeLikePrefixes } from '@/lib/strip-post-title-prefixes';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import { parseTypeIdsField } from '@/server/utils/parse-type-ids';
import { loadTypesByPostIds, replacePostTypeAssignments, type PostTypeRow } from '@/server/utils/post-type-assignments';

type CreatePostBody = {
  title?: unknown;
  content?: unknown;
  markdownContent?: unknown;
  excerpt?: unknown;
  coverUrl?: unknown;
  typeIds?: unknown;
  isHidden?: unknown;
  // mode=zen 时跳过封面/摘要自动派生，按调用方传值（通常为空）保存。
  mode?: unknown;
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

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const posts = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      sortOrder: postsTable.sortOrder,
      isHidden: postsTable.isHidden,
      isPinned: postsTable.isPinned,
      coverUrl: postsTable.coverUrl,
      excerpt: postsTable.excerpt,
      createdAt: postsTable.createdAt,
      updatedAt: postsTable.updatedAt,
    })
    .from(postsTable)
    .orderBy(asc(postsTable.sortOrder), desc(postsTable.createdAt), asc(postsTable.id));

  const typeMap = await loadTypesByPostIds(
    db,
    posts.map((p) => p.id),
  );

  return NextResponse.json({
    data: posts.map((p) => ({
      ...p,
      types: summarizeTypes(typeMap.get(p.id) ?? []),
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let title = '';
  let markdownContent = '';
  let isHidden = false;
  let inputCoverUrl = '';
  let inputExcerpt = '';
  let mode: 'traditional' | 'zen' = 'traditional';
  let typeIds: number[] = [];

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const titleRaw = formData.get('title');
    const isHiddenRaw = formData.get('isHidden');
    const coverUrlRaw = formData.get('coverUrl');
    const excerptRaw = formData.get('excerpt');
    const fileRaw = formData.get('file');
    const contentRaw = formData.get('content');

    title = typeof titleRaw === 'string' ? titleRaw.trim() : '';
    isHidden = isHiddenRaw === 'true';
    inputCoverUrl = typeof coverUrlRaw === 'string' ? coverUrlRaw.trim() : '';
    inputExcerpt = typeof excerptRaw === 'string' ? excerptRaw.trim() : '';

    if (typeof contentRaw === 'string' && contentRaw.trim()) {
      markdownContent = contentRaw;
    } else if (fileRaw instanceof File) {
      markdownContent = await fileRaw.text();
      if (!title) {
        const firstLine = markdownContent.split('\n')[0]?.trim() ?? '';
        const heading = firstLine.startsWith('# ') ? firstLine.slice(2).trim() : '';
        title = heading || fileRaw.name.replace(/\.[^.]+$/i, '').trim() || 'untitled';
      }
    }
  } else {
    const body = (await request.json()) as CreatePostBody;
    title = typeof body.title === 'string' ? body.title.trim() : '';
    markdownContent = typeof body.content === 'string' ? body.content : '';
    isHidden = body.isHidden === true;
    inputCoverUrl = typeof body.coverUrl === 'string' ? body.coverUrl : '';
    inputExcerpt = typeof body.excerpt === 'string' ? body.excerpt : '';
    if (body.mode === 'zen') mode = 'zen';
    const parsed = parseTypeIdsField(body.typeIds);
    if (parsed !== 'omit' && parsed.ok) {
      typeIds = parsed.ids;
    } else if (parsed !== 'omit') {
      return NextResponse.json({ error: 'typeIds 须为非负整数数组' }, { status: 400 });
    }
  }

  const content = stripLeadingDecorationsFromFirstH1InHtml(markdownToHTML(markdownContent));
  const metadata = derivePostMetadata({
    markdownContent,
    content,
  });

  title = stripLeadingTypeLikePrefixes(title);
  if (!title) {
    return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
  }
  if (!markdownContent.trim()) {
    return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
  }

  if (!(await assertTypeIdsValid(typeIds))) {
    return NextResponse.json({ error: '存在无效的类型 id' }, { status: 400 });
  }

  const finalExcerpt = mode === 'zen' ? inputExcerpt : inputExcerpt || metadata.excerpt;
  const finalCoverUrl = mode === 'zen' ? inputCoverUrl : inputCoverUrl || metadata.coverUrl;

  const created = await db
    .insert(postsTable)
    .values({
      title,
      content,
      markdownContent: markdownContent || null,
      excerpt: finalExcerpt,
      coverUrl: finalCoverUrl,
      sortOrder:
        ((
          await db
            .select({ id: postsTable.id, sortOrder: postsTable.sortOrder })
            .from(postsTable)
            .orderBy(asc(postsTable.sortOrder))
            .limit(1)
        )[0]?.sortOrder ?? 1) - 1,
      isHidden,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: postsTable.id,
      title: postsTable.title,
      sortOrder: postsTable.sortOrder,
      isHidden: postsTable.isHidden,
      isPinned: postsTable.isPinned,
      coverUrl: postsTable.coverUrl,
      excerpt: postsTable.excerpt,
      createdAt: postsTable.createdAt,
      updatedAt: postsTable.updatedAt,
    });

  const row = created[0];
  if (!row) {
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }

  await replacePostTypeAssignments(db, row.id, typeIds);
  const typeMap = await loadTypesByPostIds(db, [row.id]);

  return NextResponse.json({
    data: {
      ...row,
      types: summarizeTypes(typeMap.get(row.id) ?? []),
    },
  });
}
