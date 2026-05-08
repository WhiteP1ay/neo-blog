'use client';

import { Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useAdminSettings, type AdminEditMode } from '@/stores/admin/settings';

const EDIT_MODE_OPTIONS: Array<{ key: AdminEditMode; label: string; hint: string }> = [
  { key: 'traditional', label: '传统模式', hint: '弹窗 / 内嵌行编辑' },
  { key: 'zen', label: '禅模式', hint: '全屏沉浸式编辑' },
];

/**
 * Admin 顶部设置入口：齿轮图标 + 弹出面板。
 * 面板内集中存放编辑模式与主题切换；点击面板外或按 Esc 关闭。
 */
export function AdminSettingsPopover() {
  const editMode = useAdminSettings((state) => state.editMode);
  const setEditMode = useAdminSettings((state) => state.setEditMode);
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
            <p className="text-xs font-semibold text-muted-foreground">编辑模式</p>
            <div className="grid grid-cols-2 gap-2">
              {EDIT_MODE_OPTIONS.map((option) => {
                const active = editMode === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setEditMode(option.key)}
                    className={`rounded border px-2 py-2 text-left text-xs transition-colors ${
                      active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div
                      className={`mt-1 text-[10px] ${
                        active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}
                    >
                      {option.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">主题</p>
            <ThemeSwitcher />
          </section>
        </div>
      ) : null}
    </div>
  );
}
