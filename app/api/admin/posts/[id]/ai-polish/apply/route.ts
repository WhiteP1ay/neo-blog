import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import { MAX_AI_POLISH_HTML_CHARS } from '@/server/utils/post-ai-polish-compute';
import { stripLeadingTypeLikePrefixes } from '@/lib/strip-post-title-prefixes';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import { extractFirstH1PlainText, stripLeadingDecorationsFromFirstH1InHtml } from '@/server/utils/post-ai-translation-html';
import { requireAdmin } from '@/server/utils/require-admin';
import { loadTypesByPostIds, type PostTypeRow } from '@/server/utils/post-type-assignments';

function summarizeTypes(rows: PostTypeRow[]) {
  return rows.map((t) => ({
    id: t.id,
    code: t.code,
    nameZh: t.nameZh,
    nameEn: t.nameEn,
  }));
}

function parseId(id: string): number | null {
  const value = Number.parseInt(id, 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const postId = parseId(id);
  if (!postId) {
    return NextResponse.json({ error: '无效博文ID' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: '请求体无效' }, { status: 400 });
  }

  const rec = body as Record<string, unknown>;
  const rawContent = typeof rec.content === 'string' ? rec.content : '';
  const content = stripLeadingDecorationsFromFirstH1InHtml(rawContent.trim());

  if (!content.trim()) {
    return NextResponse.json({ error: 'content 不能为空' }, { status: 400 });
  }
  if (content.length > MAX_AI_POLISH_HTML_CHARS) {
    return NextResponse.json({ error: `正文过长（>${MAX_AI_POLISH_HTML_CHARS} 字符）` }, { status: 400 });
  }

  const post = await db.query.postsTable.findFirst({
    where: (table, { eq: eqFn }) => eqFn(table.id, postId),
  });
  if (!post) {
    return NextResponse.json({ error: '博文不存在' }, { status: 404 });
  }

  let nextTitle = post.title;
  const h1Text = extractFirstH1PlainText(content);
  if (h1Text) {
    const stripped = stripLeadingTypeLikePrefixes(h1Text);
    if (stripped.length > 0) {
      nextTitle = stripped;
    }
  }

  const metadata = derivePostMetadata({
    content,
    markdownContent: null,
  });

  const hasContentEnKey = 'contentEn' in rec;
  const contentEnRaw = hasContentEnKey && typeof rec.contentEn === 'string' ? rec.contentEn : undefined;

  let nextTitleEn: string | null = post.titleEn ?? null;
  let excerptEn: string | null = post.excerptEn ?? null;
  let contentEn: string | null = post.contentEn ?? null;

  if (hasContentEnKey) {
    const trimmed = (contentEnRaw ?? '').trim();
    if (trimmed.length > 0) {
      contentEn = stripLeadingDecorationsFromFirstH1InHtml(trimmed);
      const h1En = extractFirstH1PlainText(contentEn);
      const stripped = h1En ? stripLeadingTypeLikePrefixes(h1En) : '';
      nextTitleEn = stripped.length > 0 ? stripped : null;
      excerptEn =
        derivePostMetadata({
          content: contentEn,
          markdownContent: null,
        }).excerpt ?? null;
    } else {
      contentEn = null;
      nextTitleEn = null;
      excerptEn = null;
    }
  }

  const updateValues: {
    content: string;
    title: string;
    excerpt: string;
    coverUrl: string | null;
    updatedAt: Date;
    contentEn?: string | null;
    excerptEn?: string | null;
    titleEn?: string | null;
  } = {
    content,
    title: nextTitle,
    excerpt: metadata.excerpt,
    coverUrl: metadata.coverUrl,
    updatedAt: new Date(),
  };

  if (hasContentEnKey) {
    updateValues.contentEn = contentEn;
    updateValues.excerptEn = excerptEn;
    updateValues.titleEn = nextTitleEn;
  }

  const updated = await db.update(postsTable).set(updateValues).where(eq(postsTable.id, postId)).returning({
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
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }

  const typeMap = await loadTypesByPostIds(db, [postId]);
  return NextResponse.json({
    data: {
      ...updated[0],
      types: summarizeTypes(typeMap.get(postId) ?? []),
    },
  });
}
