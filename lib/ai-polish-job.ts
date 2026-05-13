/** sessionStorage：主窗写入、预览小窗读取后应 removeItem */
export const AI_POLISH_JOB_STORAGE_KEY = 'neo-blog-ai-polish-job';

/** job 有效期（毫秒），过期则小窗提示重新发起 */
export const AI_POLISH_JOB_TTL_MS = 180_000;

export type AiPolishJobPayload = {
  postId: number;
  polishCn: boolean;
  translateAppendEn: boolean;
  createdAt: number;
};
