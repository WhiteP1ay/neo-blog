/** postMessage.type：父页向预览小窗推送 AI 结果 */
export const AI_POLISH_PREVIEW_MESSAGE_TYPE = 'neo-blog-ai-polish-preview' as const;

/** postMessage.type：预览小窗在「应用」成功后通知 opener 刷新列表 */
export const AI_POLISH_APPLIED_MESSAGE_TYPE = 'neo-blog-ai-polish-applied' as const;

export type AiPolishPreviewMessagePayload = {
  type: typeof AI_POLISH_PREVIEW_MESSAGE_TYPE;
  postId: number;
  beforeHtml: string;
  afterHtml: string;
  nextTitle: string;
  excerpt: string;
  coverUrl: string | null;
  diff: { unified: string; truncated: boolean };
};

export type AiPolishAppliedMessagePayload = {
  type: typeof AI_POLISH_APPLIED_MESSAGE_TYPE;
  postId: number;
};
