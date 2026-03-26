'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type SiteThemeSwitcherProps = {
  className?: string;
};

/**
 * 旧版 (site) 专用：复古极简风的主题切换。
 * - 用纯文本链接呈现，不依赖 dropdown/menu 等重 UI。
 */
export function SiteThemeSwitcher({ className }: SiteThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const active = theme ?? 'system';

  if (!mounted) {
    return (
      <span className={className} aria-hidden>
        Theme: …
      </span>
    );
  }

  const Item = ({ value, label }: { value: 'light' | 'dark' | 'system'; label: string }) => {
    const selected = active === value;
    return (
      <button
        type="button"
        onClick={() => setTheme(value)}
        className={selected ? 'font-semibold underline underline-offset-4' : 'underline underline-offset-4 hover:opacity-80'}
        aria-pressed={selected}
      >
        {label}
      </button>
    );
  };

  return (
    <span className={className}>
      <span className="text-foreground/70">Theme:</span> <Item value="light" label="Light" />{' '}
      <span className="text-foreground/60" aria-hidden>
        /
      </span>{' '}
      <Item value="dark" label="Dark" />{' '}
      <span className="text-foreground/60" aria-hidden>
        /
      </span>{' '}
      <Item value="system" label="System" />
    </span>
  );
}

