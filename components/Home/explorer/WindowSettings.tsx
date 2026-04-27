'use client';

/**
 * 窗口内设置层：主题、占位登录注册、关于与隐私（打开站点模态框）。
 */

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SheetModalHeader } from '@/components/Home/modal/Header';
import { openSiteModal } from '../store/modals';
import { SettingsAnalytics } from './SettingsAnalytics';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { SiteModalId } from '@/components/Home/type/layout';
import { cn } from '@/lib/utils';

const THEME_OPTIONS = [
  { value: 'system' as const, label: '跟随系统', Icon: Monitor },
  { value: 'light' as const, label: '浅色', Icon: Sun },
  { value: 'dark' as const, label: '深色', Icon: Moon },
];

function ThemeModeButtonGroup() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = theme ?? 'system';

  if (!mounted) {
    return <div className="bg-muted/50 h-9 w-full max-w-sm animate-pulse rounded-lg" aria-hidden />;
  }

  return (
    <fieldset className="bg-muted/50 inline-flex rounded-lg border border-border p-0.5">
      <legend className="sr-only">主题模式</legend>
      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const selected = active === value;
        return (
          <label
            key={value}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
              selected ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <input
              type="radio"
              name="home-theme-mode"
              value={value}
              checked={selected}
              onChange={() => setTheme(value)}
              className="sr-only"
            />
            <Icon className="size-3.5 shrink-0 sm:size-4" aria-hidden />
            <span>{label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

export interface WindowSettingsProps {
  onClose: () => void;
  /** 管理端 session 存在时展示埋点统计等 */
  isAdminLoggedIn?: boolean;
}

export function WindowSettings({ onClose, isAdminLoggedIn = false }: WindowSettingsProps) {
  const openSheetAndClose = (id: SiteModalId) => {
    openSiteModal(id);
    onClose();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetModalHeader
        onClose={onClose}
        title={
          <h2 id="home-settings-title" className="text-foreground text-sm font-semibold">
            设置
          </h2>
        }
      />

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <section className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">外观</h3>
          <ThemeModeButtonGroup />
        </section>

        <Separator />

        <section className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">账号</h3>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled title="功能即将开放">
              登录
            </Button>
            <Button type="button" variant="outline" size="sm" disabled title="功能即将开放">
              注册
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">登录与注册能力尚未开放，敬请期待。</p>
        </section>

        {isAdminLoggedIn ? (
          <>
            <Separator />
            <SettingsAnalytics />
          </>
        ) : null}

        <Separator />

        <section className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">其它</h3>
          <div className="flex flex-col items-stretch gap-2 sm:max-w-xs">
            <Button type="button" variant="outline" size="sm" className="justify-start" onClick={() => openSheetAndClose('about')}>
              关于
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => openSheetAndClose('privacy')}
            >
              隐私政策
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

