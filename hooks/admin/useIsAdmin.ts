'use client';

import { useEffect, useState } from 'react';

/**
 * 客户端轻量 session 探针：从 /api/auth/me 判断当前请求者是否为管理员。
 * - 不阻塞首屏，仅用于 c 端「管理员附加入口」（编辑按钮等）的渐进式渲染；
 * - 静态/ISR 页面调用此 hook 不会破坏页面级缓存。
 */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { isAdmin?: boolean };
        if (!cancelled) setIsAdmin(payload.isAdmin === true);
      })
      .catch(() => {
        // 静默失败：未登录 / 网络异常 都视作非管理员，不影响 c 端浏览。
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return isAdmin;
}
