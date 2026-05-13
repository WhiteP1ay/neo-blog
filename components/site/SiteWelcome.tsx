'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeFromPathname, pathWithLocale } from '@/lib/site-locale';

/**
 * 首页 / 文章专题列表顶部的欢迎语（中/英随路径前缀切换）。
 */
export function SiteWelcome() {
  const pathname = usePathname() ?? '/';
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const locale = localeFromPathname(pathname);
  const aboutHref = pathWithLocale('/about', locale);

  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {locale === 'en' ? (
        <>
          Hi 👋 — welcome to White Meta. This is{' '}
          <Link href={aboutHref} className="font-medium text-foreground underline-offset-4 hover:underline">
            whitePlay
          </Link>
          &apos;s personal site.
        </>
      ) : (
        <>
          你好👋，欢迎来到 White Meta，这里是{' '}
          <Link href="/about" className="font-medium text-foreground underline-offset-4 hover:underline">
            白玩dev{' '}
          </Link>
          的个人网站。
        </>
      )}
    </p>
  );
}
