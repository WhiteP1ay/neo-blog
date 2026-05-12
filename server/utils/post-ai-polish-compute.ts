import { createTwoFilesPatch } from 'diff';
import { deepseekChat } from '@/server/utils/deepseek-chat';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import {
  appendEnglishSection,
  demoteLeadingH1InFragment,
  extractFirstH1PlainText,
  stripTranslationArtifacts,
} from '@/server/utils/post-ai-translation-html';

export const MAX_AI_POLISH_HTML_CHARS = 120_000;
export const MAX_AI_POLISH_DIFF_CHARS = 64 * 1024;

function stripModelCodeFences(text: string): string {
  let s = text.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:html|HTML)?\s*\n?/, '');
    s = s.replace(/\n?```\s*$/, '');
  }
  return s.trim();
}

export function buildAiPolishHtmlDiff(before: string, after: string): { unified: string; truncated: boolean } {
  const patch = createTwoFilesPatch('before.html', 'after.html', before, after, '旧正文', '新正文', { context: 3 });
  if (patch.length > MAX_AI_POLISH_DIFF_CHARS) {
    return {
      unified: `${patch.slice(0, MAX_AI_POLISH_DIFF_CHARS)}\n\n… [diff 已截断，完整 HTML 见「变更后」]`,
      truncated: true,
    };
  }
  return { unified: patch, truncated: false };
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

async function runPolish(html: string, signal: AbortSignal): Promise<string> {
  const raw = await deepseekChat(
    [
      { role: 'system', content: POLISH_SYSTEM },
      { role: 'user', content: `以下是需要润色的 HTML：\n\n${html}` },
    ],
    { maxTokens: 8192, temperature: 0.2, signal },
  );
  return stripModelCodeFences(raw);
}

async function runTranslate(html: string, signal: AbortSignal): Promise<string> {
  const rawEn = await deepseekChat(
    [
      { role: 'system', content: TRANSLATE_SYSTEM },
      { role: 'user', content: `以下 HTML 需要全文翻译为英文（保持结构）：\n\n${html}` },
    ],
    { maxTokens: 8192, temperature: 0.2, signal },
  );
  return demoteLeadingH1InFragment(stripModelCodeFences(rawEn));
}

export type AiPolishPreviewInput = {
  sourceHtml: string;
  titleFallback: string;
  polishCn: boolean;
  translateAppendEn: boolean;
  signal: AbortSignal;
};

export type AiPolishPreviewResult = {
  beforeHtml: string;
  afterHtml: string;
  nextTitle: string;
  excerpt: string;
  coverUrl: string | null;
  diff: { unified: string; truncated: boolean };
};

/**
 * 仅计算 AI 润色结果，不写数据库。
 */
export async function computeAiPolishPreview(input: AiPolishPreviewInput): Promise<AiPolishPreviewResult> {
  const { sourceHtml, titleFallback, polishCn, translateAppendEn, signal } = input;
  const beforeHtml = sourceHtml;

  let nextContent: string;

  if (translateAppendEn) {
    let zh = stripTranslationArtifacts(sourceHtml);
    if (polishCn) {
      zh = await runPolish(zh, signal);
    }
    const englishFragment = await runTranslate(zh, signal);
    nextContent = appendEnglishSection(zh, englishFragment);
  } else {
    nextContent = await runPolish(sourceHtml, signal);
  }

  if (!nextContent.trim()) {
    throw new Error('模型返回内容为空');
  }

  let nextTitle = titleFallback;
  const h1Text = extractFirstH1PlainText(nextContent);
  if (h1Text) {
    nextTitle = h1Text;
  }

  const metadata = derivePostMetadata({
    content: nextContent,
    markdownContent: null,
  });

  const diff = buildAiPolishHtmlDiff(beforeHtml, nextContent);

  return {
    beforeHtml,
    afterHtml: nextContent,
    nextTitle,
    excerpt: metadata.excerpt,
    coverUrl: metadata.coverUrl,
    diff,
  };
}
