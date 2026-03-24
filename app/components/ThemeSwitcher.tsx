'use client';

import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type ThemeSwitcherProps = {
  /** 桌面端：图标下拉；移动端：纵向按钮列表 */
  variant: 'dropdown' | 'list';
  /** 选择后回调（例如关闭 Sheet） */
  onAfterSelect?: () => void;
};

const OPTIONS = [
  { value: 'system', label: '跟随系统', Icon: Monitor },
  { value: 'light', label: '浅色', Icon: Sun },
  { value: 'dark', label: '深色', Icon: Moon },
] as const;

/**
 * 主题：跟随系统 / 浅色 / 深色（next-themes）
 */
export function ThemeSwitcher({ variant, onAfterSelect }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = theme ?? 'system';

  const handleChange = (value: string) => {
    setTheme(value);
    onAfterSelect?.();
  };

  if (!mounted) {
    if (variant === 'dropdown') {
      return (
        <Button variant="ghost" size="icon" disabled className="size-9" aria-hidden>
          <Monitor className="text-muted-foreground size-4 opacity-50" />
        </Button>
      );
    }
    return <p className="text-muted-foreground px-2 text-xs">主题加载中…</p>;
  }

  if (variant === 'list') {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground px-2 text-xs">外观</p>
        {OPTIONS.map(({ value, label, Icon }) => (
          <Button
            key={value}
            type="button"
            variant={active === value ? 'secondary' : 'ghost'}
            className="justify-start gap-2 font-normal"
            onClick={() => handleChange(value)}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {active === value ? <Check className="text-primary size-4 shrink-0" /> : null}
          </Button>
        ))}
      </div>
    );
  }

  const TriggerIcon = active === 'dark' ? Moon : active === 'light' ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9" aria-label="选择主题" title="主题">
          <TriggerIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={active} onValueChange={handleChange}>
          {OPTIONS.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="gap-2">
              <Icon className="size-4" />
              <span className={cn(active === value && 'font-medium')}>{label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
