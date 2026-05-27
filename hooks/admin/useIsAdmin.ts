'use client';

import { useEffect, useState } from 'react';
import { fetchAuthMeCached } from '@/hooks/admin/auth-me';

/**
 * 客户端轻量 session 探针：从 /api/auth/me 判断当前请求者是否为管理员。
 * - 不阻塞首屏，仅用于 c 端「管理员附加入口」（编辑按钮等）的渐进式渲染；
 * - 静态/ISR 页面调用此 hook 不会破坏页面级缓存。
 */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAuthMeCached().then((result) => {
      if (!cancelled) setIsAdmin(result.isAdmin);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return isAdmin;
}
