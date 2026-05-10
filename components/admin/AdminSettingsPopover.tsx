'use client';

import { Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

/**
 * Admin 顶部设置入口：齿轮图标 + 弹出面板。
 * 面板内存放主题切换；点击面板外或按 Esc 关闭。
 */
export function AdminSettingsPopover() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded border text-muted-foreground hover:bg-muted"
        aria-label="管理台设置"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Settings className="h-4 w-4" />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="管理台设置"
          className="absolute right-0 top-10 z-50 w-72 space-y-4 rounded border bg-background p-4 shadow-lg"
        >
          <section className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">主题</p>
            <ThemeSwitcher />
          </section>
        </div>
      ) : null}
    </div>
  );
}
