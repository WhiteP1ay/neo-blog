'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PostNavigationProps {
  prev: { id: number; title: string } | null;
  next: { id: number; title: string } | null;
}

/**
 * 文章导航组件（上一篇/下一篇）
 */
export function PostNavigation({ prev, next }: PostNavigationProps) {
  if (!prev && !next) {
    return null;
  }

  const linkCardClass =
    'flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/30';

  const emptyCardClass = 'flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-4 opacity-60';

  return (
    <Card className="border-t border-border shadow-sm">
      <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <div>
          {prev ? (
            <Link href={`/blog/${prev.id}`} className={cn(linkCardClass, 'group block')}>
              <span className="text-muted-foreground text-xs">上一篇</span>
              <span className="text-foreground group-hover:text-primary line-clamp-2 text-sm font-medium sm:text-base">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div className={emptyCardClass}>
              <span className="text-muted-foreground text-xs">上一篇</span>
              <span className="text-muted-foreground text-sm">没有更多了</span>
            </div>
          )}
        </div>

        <div>
          {next ? (
            <Link href={`/blog/${next.id}`} className={cn(linkCardClass, 'group block items-end text-right')}>
              <span className="text-muted-foreground text-xs">下一篇</span>
              <span className="text-foreground group-hover:text-primary line-clamp-2 text-sm font-medium sm:text-base">
                {next.title}
              </span>
            </Link>
          ) : (
            <div className={cn(emptyCardClass, 'text-right')}>
              <span className="text-muted-foreground text-xs">下一篇</span>
              <span className="text-muted-foreground text-sm">没有更多了</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
