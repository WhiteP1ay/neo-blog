import { marked } from 'marked';

/**
 * 将Markdown文本转换为HTML
 * @param markdown - Markdown文本
 * @returns HTML字符串
 */
export function markdownToHTML(markdown: string): string {
  try {
    return marked.parse(markdown) as string;
  } catch (error) {
    console.error('Markdown解析失败:', error);
    throw new Error('Markdown解析失败');
  }
}
