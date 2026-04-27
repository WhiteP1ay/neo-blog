'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DialogClose } from '@/components/ui/dialog';

export type SheetModalHeaderVariant = 'simple' | 'traffic';

export function SheetModalHeader({
  variant = 'simple',
  title,
  onClose,
  className,
}: {
  variant?: SheetModalHeaderVariant;
  title: ReactNode;
  /** 非 Dialog 场景下传入（例如 Home 设置层） */
  onClose?: () => void;
  className?: string;
}) {
  const shellClass =
    variant === 'traffic'
      ? 'border-border bg-muted/50 flex shrink-0 items-center gap-2 border-b px-4 py-2.5'
      : 'border-border bg-muted/40 flex shrink-0 items-center gap-2 border-b px-3 py-2 sm:px-4';

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      className={sheetModalCloseButtonClass}
      aria-label="关闭"
    >
      <span className={sheetModalRedDotClass} />
    </button>
  );

  return (
    <div className={cn(shellClass, className)}>
      {variant === 'traffic' ? (
        <div className="flex items-center gap-1.5 pr-2">
          {onClose ? closeButton : <DialogClose asChild>{closeButton}</DialogClose>}
          <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
        </div>
      ) : (
        onClose ? closeButton : <DialogClose asChild>{closeButton}</DialogClose>
      )}
      {title}
    </div>
  );
}

export const sheetModalCloseButtonClass =
  'ring-offset-background rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none';

export const sheetModalRedDotClass =
  'hover:bg-[#e04b45] block size-2.5 rounded-full bg-[#ff5f57] transition-colors';

