import Link from 'next/link';
import { SiteThemeSwitcher } from '@/components/site/SiteThemeSwitcher';

export const navItems = [
  { href: '/blog', label: '博客' },
  { href: '/tools', label: '工具' },
  { href: '/about', label: '关于' },
  { href: '/privacy', label: '隐私政策' },
];

export function Nav() {
  return (
    <nav className="border-b border-border bg-background sticky top-0 left-0 right-0 z-50">
      <div className="px-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-3">
          <Link href="/" className="text-base font-semibold tracking-tight text-foreground no-underline">
            White Meta
          </Link>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {navItems.map((item) => {
              return (
                <Link className="text-sm underline underline-offset-4 hover:opacity-80" key={item.href} href={item.href}>
                  {item.label}
                </Link>
              );
            })}
            <SiteThemeSwitcher className="ml-2 text-sm" />
          </div>
        </div>
      </div>
    </nav>
  );
}

