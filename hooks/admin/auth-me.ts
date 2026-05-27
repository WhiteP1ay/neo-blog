'use client';

type AuthMePayload = { isAdmin?: boolean };

type AuthMeResult = {
  ok: boolean;
  isAdmin: boolean;
};

let cachedAuthMe: AuthMeResult | null = null;
let inflight: Promise<AuthMeResult> | null = null;

/**
 * 客户端 /api/auth/me 请求缓存（模块级单例）：
 * - 合并并发请求：同一轮渲染中多个组件调用也只会发一次网络请求
 * - 复用结果：返回列表页时不重复探针
 */
export function fetchAuthMeCached(): Promise<AuthMeResult> {
  if (cachedAuthMe) return Promise.resolve(cachedAuthMe);
  if (inflight) return inflight;

  inflight = fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(async (response) => {
      if (!response.ok) {
        return { ok: false, isAdmin: false };
      }
      const payload = (await response.json()) as AuthMePayload;
      return { ok: true, isAdmin: payload.isAdmin === true };
    })
    .catch(() => {
      return { ok: false, isAdmin: false };
    })
    .then((result) => {
      cachedAuthMe = result;
      inflight = null;
      return result;
    });

  return inflight;
}
