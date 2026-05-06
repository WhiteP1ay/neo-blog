'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ThemeSwitcherProps = {
  className?: string;
};

/**
 * 通用主题切换器：支持 light / dark / system 三态。
 */
export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={`text-xs text-muted-foreground ${className ?? ''}`.trim()}>Theme: ...</span>;
  }

  const activeTheme = theme ?? 'system';
  const options: Array<{ key: 'light' | 'dark' | 'system'; label: string }> = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'system', label: 'System' },
  ];

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className ?? ''}`.trim()}>
      <span>Theme:</span>
      {options.map((option) => {
        const selected = activeTheme === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => setTheme(option.key)}
            className={`rounded border px-2 py-1 transition-colors ${
              selected ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
            aria-pressed={selected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
