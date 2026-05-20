'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeFromPathname, pathWithLocale } from '@/lib/site-locale';

type SiteHeaderSearchLinkProps = {
  className: string;
};

/**
 * 按当前路径语言前缀跳转 /search 或 /en/search
 */
export function SiteHeaderSearchLink({ className }: SiteHeaderSearchLinkProps) {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname ?? '/');
  return (
    <Link href={pathWithLocale('/search', locale)} className={className}>
      {locale === 'en' ? 'Search' : '搜索'}
    </Link>
  );
}
