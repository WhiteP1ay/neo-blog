/**
 * 从 markdown 提取第一张图片 URL。
 */
function extractCoverFromMarkdown(markdown: string | null | undefined): string | null {
  if (!markdown) return null;
  const match = markdown.match(/!\[[^\]]*]\(([^)\s]+(?:\s+"[^"]*")?)\)/);
  if (!match) return null;
  const urlPart = match[1].trim().split(/\s+"/)[0];
  const cleaned = urlPart.replace(/^<|>$/g, '');
  return cleaned || null;
}

/**
 * 从 HTML 提取第一张图片 URL。
 */
function extractCoverFromHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

/**
 * 将富文本/markdown 转为纯文本（用于摘要）。
 */
function toPlainText(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, ' ')
    .replace(/\[[^\]]*]\(([^)]+)\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 生成文章封面与摘要。
 */
export function derivePostMetadata(input: {
  markdownContent?: string | null;
  content?: string | null;
  excerptLength?: number;
}): { coverUrl: string | null; excerpt: string } {
  const markdownContent = input.markdownContent ?? null;
  const content = input.content ?? null;
  const excerptLength = input.excerptLength ?? 100;
  const coverUrl = extractCoverFromMarkdown(markdownContent) ?? extractCoverFromHtml(content);
  const source = markdownContent || content || '';
  const plain = toPlainText(source);
  const excerpt = plain.slice(0, excerptLength);
  return { coverUrl, excerpt };
}
