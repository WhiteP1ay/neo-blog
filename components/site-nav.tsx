'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteNav() {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `transition-colors duration-150 hover:text-foreground ${
      active ? 'text-foreground underline decoration-primary underline-offset-4' : 'text-muted-foreground'
    }`;

  return (
    <nav className="mt-4 flex items-center justify-center gap-6 text-sm font-medium">
      <Link href="/" className={linkClass(pathname === '/')}>
        Home
      </Link>
      <Link href="/blog" className={linkClass(pathname.startsWith('/blog'))}>
        Blog
      </Link>
    </nav>
  );
}
