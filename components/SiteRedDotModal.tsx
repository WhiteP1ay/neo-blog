'use client';

import type { ReactNode } from 'react';
import {
  SheetModalHeader,
  sheetModalCloseButtonClass,
  sheetModalRedDotClass,
} from '@/components/SheetModalHeader';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type SiteRedDotModalHeaderVariant = 'simple' | 'traffic';

type SiteRedDotModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** simple：红点 + 分隔 + 标题；traffic：红点与黄绿装饰 + 标题（工具窗） */
  headerVariant?: SiteRedDotModalHeaderVariant;
  className?: string;
  children: ReactNode;
};

/**
 * 全站统一样式：关闭为左上角红色圆点（与 SheetModalHeader 一致）
 */
export function SiteRedDotModal({
  open,
  onOpenChange,
  title,
  headerVariant = 'simple',
  className,
  children,
}: SiteRedDotModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className={cn(
          'flex max-h-[min(88dvh,820px)] flex-col gap-0 overflow-hidden p-0',
          'w-[min(100vw-1.5rem,48rem)] max-w-[calc(100vw-1.5rem)] rounded-2xl border-border shadow-2xl',
          className,
        )}
      >
        <DialogDescription className="sr-only">
          可在弹窗内阅读{title}全文，关闭请点击左上角红色按钮
        </DialogDescription>
        {headerVariant === 'simple' ? (
          <SheetModalHeader
            closeControl={
              <DialogClose asChild>
                <button type="button" className={sheetModalCloseButtonClass} aria-label="关闭">
                  <span className={sheetModalRedDotClass} />
                </button>
              </DialogClose>
            }
            title={<DialogTitle className="text-foreground text-sm font-semibold">{title}</DialogTitle>}
          />
        ) : (
          <div className="border-border bg-muted/50 flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
            <div className="flex items-center gap-1.5 pr-2">
              <DialogClose asChild>
                <button type="button" className={sheetModalCloseButtonClass} aria-label="关闭">
                  <span className={sheetModalRedDotClass} />
                </button>
              </DialogClose>
              <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
              <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
            </div>
            <DialogTitle className="text-foreground text-sm font-semibold sm:text-base">{title}</DialogTitle>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
