/**
 * postMessage.type：父页向预览小窗推送 AI 结果（大包 HTML）。
 * @deprecated 预览小窗已改为 sessionStorage + 自行请求 preview 流；保留常量供旧代码或调试兼容。
 */
export const AI_POLISH_PREVIEW_MESSAGE_TYPE = 'neo-blog-ai-polish-preview' as const;

/** postMessage.type：预览小窗在「应用」成功后通知 opener 刷新列表 */
export const AI_POLISH_APPLIED_MESSAGE_TYPE = 'neo-blog-ai-polish-applied' as const;

export type AiPolishPreviewMessagePayload = {
  type: typeof AI_POLISH_PREVIEW_MESSAGE_TYPE;
  postId: number;
  beforeHtml: string;
  afterHtml: string;
  afterHtmlEn: string | null;
  nextTitle: string;
  nextTitleEn: string | null;
  excerpt: string;
  excerptEn: string | null;
  coverUrl: string | null;
  diff: { unified: string; truncated: boolean };
};

export type AiPolishAppliedMessagePayload = {
  type: typeof AI_POLISH_APPLIED_MESSAGE_TYPE;
  postId: number;
};
