'use client';

import { Suspense, createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  SheetModalHeader,
  sheetModalCloseButtonClass,
  sheetModalRedDotClass,
} from '@/components/SheetModalHeader';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { SITE_SHEET_QUERY_KEY, isSiteSheetModalId, type SiteModalId } from '@/app/nav';

const TITLES: Record<SiteModalId, string> = {
  tools: '工具与资源',
  about: '关于',
  privacy: '隐私政策',
};

type SitePageModalContextValue = {
  openModal: (id: SiteModalId) => void;
  closeModal: () => void;
};

const SitePageModalContext = createContext<SitePageModalContextValue | null>(null);

export function useSitePageModal(): SitePageModalContextValue {
  const ctx = useContext(SitePageModalContext);
  if (!ctx) {
    throw new Error('useSitePageModal 必须在 SitePageModalsProvider 内使用');
  }
  return ctx;
}

function SitePageModalsProviderInner({
  children,
  aboutSlot,
  privacySlot,
  toolsSlot,
}: {
  children: ReactNode;
  aboutSlot: ReactNode;
  privacySlot: ReactNode;
  toolsSlot: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sheetRaw = searchParams.get(SITE_SHEET_QUERY_KEY);
  const open: SiteModalId | null = sheetRaw != null && isSiteSheetModalId(sheetRaw) ? sheetRaw : null;

  useEffect(() => {
    const raw = searchParams.get(SITE_SHEET_QUERY_KEY);
    if (raw != null && !isSiteSheetModalId(raw)) {
      const p = new URLSearchParams(searchParams.toString());
      p.delete(SITE_SHEET_QUERY_KEY);
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  const openModal = useCallback(
    (id: SiteModalId) => {
      const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : searchParams.toString());
      p.set(SITE_SHEET_QUERY_KEY, id);
      router.push(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const closeModal = useCallback(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : searchParams.toString());
    p.delete(SITE_SHEET_QUERY_KEY);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const value = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  const body =
    open === 'about' ? aboutSlot : open === 'privacy' ? privacySlot : open === 'tools' ? toolsSlot : null;

  return (
    <SitePageModalContext.Provider value={value}>
      {children}
      <Dialog
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) {
            closeModal();
          }
        }}
      >
        <DialogContent
          hideClose
          className={cn(
            'flex max-h-[min(88dvh,820px)] flex-col gap-0 overflow-hidden p-0',
            'w-[min(100vw-1.5rem,48rem)] max-w-[calc(100vw-1.5rem)] rounded-2xl border-border shadow-2xl',
            open === 'tools' && 'sm:max-w-5xl',
            open === 'about' && 'sm:max-w-3xl',
            open === 'privacy' && 'sm:max-w-2xl',
          )}
        >
          {open ? (
            <DialogDescription className="sr-only">可在弹窗内阅读{TITLES[open]}全文，关闭请点击左上角红色按钮</DialogDescription>
          ) : null}
          {open === 'about' || open === 'privacy' ? (
            <SheetModalHeader
              closeControl={
                <DialogClose asChild>
                  <button type="button" className={sheetModalCloseButtonClass} aria-label="关闭">
                    <span className={sheetModalRedDotClass} />
                  </button>
                </DialogClose>
              }
              title={
                <DialogTitle className="text-foreground text-sm font-semibold">
                  {open ? TITLES[open] : '\u00A0'}
                </DialogTitle>
              }
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
              <DialogTitle className="text-foreground text-sm font-semibold sm:text-base">
                {open ? TITLES[open] : '\u00A0'}
              </DialogTitle>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {body}
          </div>
        </DialogContent>
      </Dialog>
    </SitePageModalContext.Provider>
  );
}

/**
 * 全站：工具 / 关于 / 隐私以弹窗展示；URL 用 ?sheet=tools|about|privacy 同步；独立路由仍保留
 */
export function SitePageModalsProvider({
  children,
  aboutSlot,
  privacySlot,
  toolsSlot,
}: {
  children: ReactNode;
  aboutSlot: ReactNode;
  privacySlot: ReactNode;
  toolsSlot: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <SitePageModalsProviderInner aboutSlot={aboutSlot} privacySlot={privacySlot} toolsSlot={toolsSlot}>
        {children}
      </SitePageModalsProviderInner>
    </Suspense>
  );
}
