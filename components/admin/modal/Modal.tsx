'use client';

import type { ReactNode } from 'react';
import {
  SheetModalHeader,
} from './Header';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type SiteRedDotModalHeaderVariant = 'simple' | 'traffic';

type SiteRedDotModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  headerVariant?: SiteRedDotModalHeaderVariant;
  className?: string;
  children: ReactNode;
};

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
        <SheetModalHeader
          variant={headerVariant}
          title={
            <DialogTitle className={cn('text-foreground text-sm font-semibold', headerVariant === 'traffic' && 'sm:text-base')}>
              {title}
            </DialogTitle>
          }
        />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

