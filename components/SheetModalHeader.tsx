'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** 与首页设置层一致：左侧关闭控件 + 间隔点 + 标题 */
export function SheetModalHeader({
  closeControl,
  title,
  className,
}: {
  closeControl: ReactNode;
  title: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border bg-muted/40 flex shrink-0 items-center gap-2 border-b px-3 py-2 sm:px-4',
        className,
      )}
    >
      {closeControl}
      <span className="text-muted-foreground text-xs" aria-hidden>
        ·
      </span>
      {title}
    </div>
  );
}

export const sheetModalCloseButtonClass =
  'ring-offset-background rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none';

export const sheetModalRedDotClass =
  'hover:bg-[#e04b45] block size-2.5 rounded-full bg-[#ff5f57] transition-colors';
