import type { ReactNode } from 'react';
import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';

function SiteHeader() {
  return (
    <header className="border-b border-border bg-background py-8">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-foreground transition-colors duration-150 hover:text-foreground/70"
        >
          White Meta
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">白玩dev 的个人网站</p>
        <SiteNav />
      </div>
    </header>
  );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
