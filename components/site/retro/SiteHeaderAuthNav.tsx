'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { logoutToHome } from '@/server/actions/login';

type SiteHeaderAuthNavProps = {
  navLinkClass: string;
  navButtonClass: string;
};

/**
 * 头部登录态：客户端请求 /api/auth/me，避免在布局里调用 cookies()
 * 破坏 generateStaticParams / ISR 页面的静态渲染。
 */
export function SiteHeaderAuthNav({ navLinkClass, navButtonClass }: SiteHeaderAuthNavProps) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((res) => {
        if (!cancelled) setLoggedIn(res.ok);
      })
      .catch(() => {
        if (!cancelled) setLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loggedIn !== true) {
    return (
      <Link href="/login" className={navLinkClass}>
        登录
      </Link>
    );
  }

  return (
    <form action={logoutToHome}>
      <button type="submit" className={navButtonClass}>
        登出
      </button>
    </form>
  );
}
