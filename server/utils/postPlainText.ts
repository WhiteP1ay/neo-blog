/**
 * 从 Markdown 提取用于全文检索的纯文本（不含代码块等噪声）
 */
export function extractPlainBodyFromMarkdown(
  markdown: string | null | undefined
): string {
  if (!markdown) {
    return "";
  }

  let text = markdown;
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]+`/g, " ");
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/[*_~]/g, "");
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * 文章正文纯文本（不含标题，供 ts_headline 摘要使用）
 */
export function buildPlainBody(
  markdownContent: string | null | undefined
): string {
  return extractPlainBodyFromMarkdown(markdownContent);
}
