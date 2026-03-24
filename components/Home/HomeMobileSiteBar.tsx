'use client';

import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { navItems } from '@/app/nav';

/**
 * 窄屏首页：站点链接与主题切换（无全局 Nav 时使用）
 */
export function HomeMobileSiteBar() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted-foreground hover:text-primary rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">主题</span>
        <ThemeSwitcher variant="dropdown" />
      </div>
    </div>
  );
}
