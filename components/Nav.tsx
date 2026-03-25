'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { openSiteModal } from '@/lib/site-modals-store';
import { navItems } from '@/app/nav';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

function shouldOpenModalInstead(e: MouseEvent<HTMLAnchorElement>) {
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && e.button === 0;
}

export function Nav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isActive = (href: string) => {
    return pathname?.startsWith(href);
  };

  const linkClass = (href: string) =>
    cn(
      'text-sm font-medium transition-colors',
      isActive(href) ? 'text-primary' : 'text-muted-foreground hover:text-primary',
    );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">White Meta</h1>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
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
            <ThemeSwitcher variant="dropdown" />
          </div>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="打开菜单">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[min(100vw-1rem,20rem)] flex-col">
              <SheetHeader>
                <SheetTitle>导航</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Button key={item.href} variant="ghost" className="justify-start font-normal" asChild>
                    <Link
                      href={item.href}
                      className={linkClass(item.href)}
                      onClick={(e) => {
                        const modal = item.modal;
                        if (modal && shouldOpenModalInstead(e)) {
                          e.preventDefault();
                          openSiteModal(modal);
                        }
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {item.label}
                    </Link>
                  </Button>
                ))}
                <Separator className="my-2" />
                <Button variant="ghost" className="justify-start font-normal" asChild>
                  <a
                    href="mailto:EthanPark2233@gmail.com"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    Email
                  </a>
                </Button>
                <Separator className="my-2" />
                <ThemeSwitcher variant="list" onAfterSelect={() => setIsMobileMenuOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
