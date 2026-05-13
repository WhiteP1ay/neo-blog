export type AdminJsonPayload<T> = {
  data?: T;
  success?: boolean;
  error?: string;
};

/**
 * 解析管理端 / 站点统一 JSON 响应（`data` 或 `success`）。
 */
export async function parseAdminJsonResponse<T>(response: Response, requireData = true): Promise<T | null> {
  const payload = (await response.json()) as AdminJsonPayload<T>;
  if (!response.ok) {
    throw new Error(payload.error ?? '请求失败');
  }
  if (payload.data !== undefined) {
    return payload.data;
  }
  if (payload.success === true) {
    return null;
  }
  if (requireData) {
    throw new Error('响应数据缺失');
  }
  return null;
}

/** 仅校验成功，不读取 `data`。 */
export async function requireAdminOkResponse(response: Response): Promise<void> {
  const payload = (await response.json()) as AdminJsonPayload<unknown>;
  if (!response.ok) {
    throw new Error(payload.error ?? '请求失败');
  }
}
