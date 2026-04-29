import { marked } from 'marked';

/**
 * marked 实例配置：
 * - gfm: 启用 GitHub Flavored Markdown（含表格）
 * - breaks: 保留单换行换行体验
 */
marked.use({
  gfm: true,
  breaks: true,
});

/**
 * 统一 Markdown 文本，提升表格等语法兼容性。
 */
function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/^\uFEFF/, '') // 移除 UTF-8 BOM，避免首行语法识别异常
    .replace(/\r\n?/g, '\n') // 统一换行符
    .trim();
}

/**
 * 将Markdown文本转换为HTML
 * @param markdown - Markdown文本
 * @returns HTML字符串
 */
export function markdownToHTML(markdown: string): string {
  try {
    return marked.parse(normalizeMarkdown(markdown)) as string;
  } catch (error) {
    console.error('Markdown解析失败:', error);
    throw new Error('Markdown解析失败');
  }
}
