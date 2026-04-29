/**
 * 判断上传文件是否为 Markdown。
 *
 * 说明：
 * - 优先根据文件名后缀 `.md` 判断，兼容浏览器未正确传递 MIME 的情况。
 * - 同时兼容常见 Markdown MIME 类型，避免不同客户端行为不一致。
 */
export function isMarkdownUpload(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.md')) return true;

  const mimeType = file.type.toLowerCase();
  return mimeType === 'text/markdown' || mimeType === 'text/x-markdown';
}
