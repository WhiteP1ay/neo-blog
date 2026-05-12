import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import { deepseekChat } from '@/server/utils/deepseek-chat';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import {
  appendEnglishSection,
  demoteLeadingH1InFragment,
  extractFirstH1PlainText,
  stripTranslationArtifacts,
} from '@/server/utils/post-ai-translation-html';
import { requireAdmin } from '@/server/utils/require-admin';

const MAX_HTML_CHARS = 120_000;

function parseId(id: string): number | null {
  const value = Number.parseInt(id, 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function stripModelCodeFences(text: string): string {
  let s = text.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:html|HTML)?\s*\n?/, '');
    s = s.replace(/\n?```\s*$/, '');
  }
  return s.trim();
}

const POLISH_SYSTEM = `你是中文技术博客编辑。用户会提供一段 HTML 正文（来自富文本编辑器，可能含代码块、表格、图片等）。
你的任务：在尽量保留原有 HTML 标签与属性（尤其是 img 的 src、代码块 pre/code、a 的 href）的前提下，完成：
- 调整段落与标题层级，使结构更清晰；
- 修正错别字与明显语病；
- 中文中夹杂英文单词时，在英文单词与中文之间增加半角空格（如「使用 API 调用」）；
- 按语境修正英文大小写（专有名词、API、HTTP 等保持常见写法）。

硬性要求：
- 只输出 HTML 片段字符串，不要 Markdown，不要用 \`\`\` 代码围栏包裹；
- 不要输出 <html>、<body> 外壳；
- 不要删除或改写图片 URL、代码块内容（仅可调整代码块外的说明文字）；
- 不要编造不存在的链接。`;

const TRANSLATE_SYSTEM = `你是专业英译编辑。用户会提供一段**中文文章**的 HTML（含 h1、段落、列表、代码块等）。
请将其中**所有面向读者的中文**翻译成自然、准确的英文；保留原有 HTML 结构与标签属性（img src、代码块内的代码、a 的 href 等尽量不改）。
代码块内的**中文注释**可翻译；代码标识符本身不要翻译。

硬性要求：
- 只输出 HTML 片段，不要 Markdown，不要用 \`\`\` 围栏；
- 不要输出 <html>、<body>；
- 不要编造链接。若原文含 h1，你的输出也可从 h1 开始，与原文结构平行。`;

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

  const modeRaw = typeof body === 'object' && body !== null && 'mode' in body ? (body as { mode: unknown }).mode : null;
  const mode = modeRaw === 'polish_cn' || modeRaw === 'translate_append_en' ? modeRaw : null;
  if (!mode) {
    return NextResponse.json({ error: 'mode 须为 polish_cn 或 translate_append_en' }, { status: 400 });
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
  if (sourceHtml.length > MAX_HTML_CHARS) {
    return NextResponse.json({ error: `正文过长（>${MAX_HTML_CHARS} 字符），请拆篇或精简后再试` }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    let nextContent: string;
    let nextTitle: string = post.title;

    if (mode === 'polish_cn') {
      const raw = await deepseekChat(
        [
          { role: 'system', content: POLISH_SYSTEM },
          {
            role: 'user',
            content: `以下是需要润色的 HTML：\n\n${sourceHtml}`,
          },
        ],
        { maxTokens: 8192, temperature: 0.2, signal: controller.signal },
      );
      nextContent = stripModelCodeFences(raw);
    } else {
      const chineseOnly = stripTranslationArtifacts(sourceHtml);
      const rawEn = await deepseekChat(
        [
          { role: 'system', content: TRANSLATE_SYSTEM },
          {
            role: 'user',
            content: `以下 HTML 需要全文翻译为英文（保持结构）：\n\n${chineseOnly}`,
          },
        ],
        { maxTokens: 8192, temperature: 0.2, signal: controller.signal },
      );
      const englishFragment = demoteLeadingH1InFragment(stripModelCodeFences(rawEn));
      nextContent = appendEnglishSection(chineseOnly, englishFragment);
    }

    if (!nextContent.trim()) {
      return NextResponse.json({ error: '模型返回内容为空' }, { status: 502 });
    }

    const h1Text = extractFirstH1PlainText(nextContent);
    if (h1Text) {
      nextTitle = h1Text;
    }

    const metadata = derivePostMetadata({
      content: nextContent,
      markdownContent: null,
    });

    const updated = await db
      .update(postsTable)
      .set({
        content: nextContent,
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误';
    if (e instanceof Error && e.name === 'AbortError') {
      return NextResponse.json({ error: '请求超时，请稍后重试' }, { status: 504 });
    }
    console.error('[ai-polish]', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
