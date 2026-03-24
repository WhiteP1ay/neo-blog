'use client';

import { ArrowUp, List } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/app/components/ui/sheet';
import { TocContent } from './TocContent';
import type { TocItem } from './types';

interface MobileTOCProps {
  toc: TocItem[];
  activeId: string;
  showBackToTop: boolean;
  onScrollToHeading: (id: string) => void;
  onScrollToTop: () => void;
}

/**
 * 移动端目录：底部 Sheet + 悬浮按钮（shadcn）
 */
export function MobileTOC({ toc, activeId, showBackToTop, onScrollToHeading, onScrollToTop }: MobileTOCProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (toc.length === 0) {
    return null;
  }

  return (
    <>
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl px-4 pb-6 pt-2">
          <SheetHeader className="text-left">
            <SheetTitle>目录</SheetTitle>
          </SheetHeader>
          <div className="mt-2">
            <TocContent
              toc={toc}
              activeId={activeId}
              showBackToTop={showBackToTop}
              onScrollToHeading={(id) => {
                onScrollToHeading(id);
                setIsMenuOpen(false);
              }}
              onScrollToTop={() => {
                onScrollToTop();
                setIsMenuOpen(false);
              }}
              onCloseMobileMenu={() => setIsMenuOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="fixed right-4 bottom-20 z-50 lg:hidden">
        <Button
          type="button"
          size="icon"
          className="size-12 rounded-full shadow-lg"
          aria-label={isMenuOpen ? '关闭目录' : '打开目录'}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <List className="size-6" />
        </Button>
      </div>

      {showBackToTop ? (
        <div className="fixed right-4 bottom-4 z-50 lg:hidden">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-12 rounded-full shadow-lg"
            aria-label="返回顶部"
            onClick={onScrollToTop}
          >
            <ArrowUp className="size-6" />
          </Button>
        </div>
      ) : null}
    </>
  );
}
