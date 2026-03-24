'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { navItems } from '@/app/nav';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { cn } from '@/lib/utils';

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
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
            <ThemeSwitcher variant="dropdown" />
            <Link href="/admin" className="opacity-0">
              管理
            </Link>
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
                    <Link href={item.href} className={linkClass(item.href)} onClick={() => setIsMobileMenuOpen(false)}>
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
                <Button variant="ghost" className="justify-start font-normal opacity-20 hover:opacity-100" asChild>
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    管理
                  </Link>
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
