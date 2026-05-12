import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import { MAX_AI_POLISH_HTML_CHARS } from '@/server/utils/post-ai-polish-compute';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import { extractFirstH1PlainText } from '@/server/utils/post-ai-translation-html';
import { requireAdmin } from '@/server/utils/require-admin';

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

  const content =
    typeof (body as { content?: unknown }).content === 'string' ? (body as { content: string }).content : '';

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
    nextTitle = h1Text;
  }

  const metadata = derivePostMetadata({
    content,
    markdownContent: null,
  });

  const updated = await db
    .update(postsTable)
    .set({
      content,
      title: nextTitle,
      excerpt: metadata.excerpt,
      coverUrl: metadata.coverUrl,
      updatedAt: new Date(),
    })
    .where(eq(postsTable.id, postId))
    .returning({
      id: postsTable.id,
      title: postsTable.title,
      type: postsTable.type,
      sortOrder: postsTable.sortOrder,
      isHidden: postsTable.isHidden,
      isPinned: postsTable.isPinned,
      coverUrl: postsTable.coverUrl,
      excerpt: postsTable.excerpt,
      updatedAt: postsTable.updatedAt,
    });

  if (!updated[0]) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }

  return NextResponse.json({ data: updated[0] });
}
