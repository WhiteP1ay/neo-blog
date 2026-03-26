'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiteThemeSwitcher } from '@/components/site/SiteThemeSwitcher';
import { openSiteModal } from '@/components/Home';
import { navItems } from '@/app/nav';
import { cn } from '@/lib/utils';

function shouldOpenModalInstead(e: MouseEvent<HTMLAnchorElement>) {
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && e.button === 0;
}

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => {
    return pathname?.startsWith(href);
  };

  const linkClass = (href: string) =>
    cn(
      'text-sm underline underline-offset-4 transition-opacity',
      isActive(href) ? 'text-foreground font-semibold' : 'text-foreground/80 hover:opacity-80',
    );

  return (
    <nav className="border-b border-border bg-background">
      <div className="site-container">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-3">
          <Link href="/" className="text-base font-semibold tracking-tight text-foreground no-underline">
            White Meta
          </Link>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {navItems.map((item) => {
              if (item.modal) {
                const modalId = item.modal;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={linkClass(item.href)}
                    onClick={(e) => {
                      if (!shouldOpenModalInstead(e)) return;
                      e.preventDefault();
                      openSiteModal(modalId);
                    }}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                  {item.label}
                </Link>
              );
            })}
            <a href="mailto:EthanPark2233@gmail.com" className={cn(linkClass('/__mail'), 'no-underline')}>
              Email
            </a>
            <SiteThemeSwitcher className="ml-2 text-sm" />
          </div>
        </div>
      </div>
    </nav>
  );
}

