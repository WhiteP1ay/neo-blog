import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { MAX_AI_POLISH_HTML_CHARS, computeAiPolishPreview } from '@/server/utils/post-ai-polish-compute';
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

  const polishCn = (body as { polishCn?: unknown }).polishCn === true;
  const translateAppendEn = (body as { translateAppendEn?: unknown }).translateAppendEn === true;

  if (!polishCn && !translateAppendEn) {
    return NextResponse.json({ error: '请至少选择 polishCn 或 translateAppendEn 中的一项' }, { status: 400 });
  }

  const post = await db.query.postsTable.findFirst({
    where: (table, { eq: eqFn }) => eqFn(table.id, postId),
  });
  if (!post) {
    return NextResponse.json({ error: '博文不存在' }, { status: 404 });
  }

  const sourceHtml = post.content ?? '';
  if (!sourceHtml.trim()) {
    return NextResponse.json({ error: '正文为空' }, { status: 400 });
  }
  if (sourceHtml.length > MAX_AI_POLISH_HTML_CHARS) {
    return NextResponse.json(
      { error: `正文过长（>${MAX_AI_POLISH_HTML_CHARS} 字符），请拆篇或精简后再试` },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const preview = await computeAiPolishPreview({
      sourceHtml,
      titleFallback: post.title,
      polishCn,
      translateAppendEn,
      signal: controller.signal,
    });

    return NextResponse.json({
      data: {
        postId,
        beforeHtml: preview.beforeHtml,
        afterHtml: preview.afterHtml,
        nextTitle: preview.nextTitle,
        excerpt: preview.excerpt,
        coverUrl: preview.coverUrl,
        diff: preview.diff,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误';
    if (e instanceof Error && e.name === 'AbortError') {
      return NextResponse.json({ error: '请求超时，请稍后重试' }, { status: 504 });
    }
    console.error('[ai-polish-preview]', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
