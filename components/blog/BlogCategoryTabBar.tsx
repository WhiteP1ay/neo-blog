import Link from 'next/link';
import type { BlogCategoryTab } from '@/app/(site)/blog/topicsHandle';
import { cn } from '@/lib/utils';

export type { BlogCategoryTab };

type BlogCategoryTabBarProps = {
  tabs: BlogCategoryTab[];
  activeKey: string;
};

/**
 * 博客列表顶部分类：Link + 查询参数，无客户端状态
 */
export function BlogCategoryTabBar({ tabs, activeKey }: BlogCategoryTabBarProps) {
  return (
    <div
      className="mb-6 flex flex-wrap gap-2"
      role="tablist"
      aria-label="按分类筛选文章"
    >
      {tabs.map((tab) => {
        const selected = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={selected}
            className={cn(
              'inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:text-sm',
              selected
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-foreground hover:bg-muted',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
