'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeFromPathname, pathWithLocale } from '@/lib/site-locale';

type SiteLogoLinkProps = {
  className: string;
};

export function SiteLogoLink({ className }: SiteLogoLinkProps) {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const href = pathWithLocale('/', locale);

  return (
    <Link href={href} className={className}>
      White Meta
    </Link>
  );
}
