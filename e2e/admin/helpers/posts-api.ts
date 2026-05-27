import type { APIRequestContext } from '@playwright/test';

type AdminJsonPayload<T> = {
  data?: T;
  success?: boolean;
  error?: string;
};

async function parseJson<T>(response: { ok: () => boolean; json: () => Promise<unknown> }): Promise<T> {
  const payload = (await response.json()) as AdminJsonPayload<T>;
  if (!response.ok()) {
    throw new Error(payload.error ?? `请求失败（${response.status?.() ?? 'unknown'}）`);
  }
  if (payload.data === undefined) {
    throw new Error('响应 data 缺失');
  }
  return payload.data;
}

export async function createPost(
  request: APIRequestContext,
  opts: { title: string; content: string; isHidden?: boolean },
): Promise<{ id: number; title: string }> {
  const res = await request.post('/api/admin/posts', {
    headers: { 'content-type': 'application/json' },
    data: {
      title: opts.title,
      content: opts.content,
      mode: 'zen',
      isHidden: opts.isHidden ?? false,
    },
  });
  return parseJson<{ id: number; title: string }>(res);
}

export async function createPostType(
  request: APIRequestContext,
  opts: { code: string; nameZh: string; nameEn: string },
): Promise<{ id: number; code: string; nameZh: string }> {
  const res = await request.post('/api/admin/post-types', {
    headers: { 'content-type': 'application/json' },
    data: opts,
  });
  return parseJson<{ id: number; code: string; nameZh: string }>(res);
}

export async function deletePost(request: APIRequestContext, id: number): Promise<void> {
  const res = await request.delete(`/api/admin/posts/${id}`);
  if (!res.ok()) {
    const payload = (await res.json().catch(() => ({}))) as AdminJsonPayload<unknown>;
    throw new Error(payload.error ?? `删除博文失败（${res.status()}）`);
  }
}

export async function deletePostType(request: APIRequestContext, id: number): Promise<void> {
  const res = await request.delete(`/api/admin/post-types/${id}`);
  if (!res.ok()) {
    const payload = (await res.json().catch(() => ({}))) as AdminJsonPayload<unknown>;
    throw new Error(payload.error ?? `删除类型失败（${res.status()}）`);
  }
}
