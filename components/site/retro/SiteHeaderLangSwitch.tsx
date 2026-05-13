'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeFromPathname, pathWithLocale, stripEnPrefix } from '@/lib/site-locale';
import { cn } from '@/lib/utils';

const linkBase =
  'cursor-pointer rounded-md px-2 py-1 text-xs motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background';

/**
 * 头部右上角：中/英路径切换。
 */
export function SiteHeaderLangSwitch() {
  const pathname = usePathname() ?? '/';
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const locale = localeFromPathname(pathname);
  const basePath = stripEnPrefix(pathname);
  const zhHref = pathWithLocale(basePath, 'zh');
  const enHref = pathWithLocale(basePath, 'en');

  return (
    <div className="flex items-center gap-1.5" aria-label={locale === 'en' ? 'Site language' : '站点语言'}>
      <span className="hidden text-xs text-muted-foreground sm:inline">{locale === 'en' ? 'Language' : '语言'}</span>
      <div className="flex items-center gap-0.5 rounded-md border border-border/80 bg-muted/30 p-0.5">
        <Link
          href={zhHref}
          className={cn(
            linkBase,
            locale === 'zh'
              ? 'bg-background font-medium text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          hrefLang="zh-CN"
        >
          中文
        </Link>
        <Link
          href={enHref}
          className={cn(
            linkBase,
            locale === 'en'
              ? 'bg-background font-medium text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          hrefLang="en"
        >
          EN
        </Link>
      </div>
    </div>
  );
}
