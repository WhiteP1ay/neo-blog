'use client';

/**
 * 顶部栏（标题/导航/设置入口）。
 */

import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/server/actions/login';
import { useLayoutStore } from '@/stores/admin/layout';

export type HeaderProps = {
  isAdminLoggedIn: boolean;
};

export function Header({ isAdminLoggedIn }: HeaderProps) {
  const openSettings = useLayoutStore((s) => s.openSettings);

  return (
    <header className="border-border bg-muted/40 shrink-0 border-b">
      <div className="flex h-10 items-center gap-3 px-4">
        <Link href="/admin" className="truncate text-base font-bold text-foreground">
          White Meta
        </Link>

        <span className="min-w-2 flex-1" />
        {isAdminLoggedIn ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-9 shrink-0"
            onClick={() => void logout()}
            aria-label="登出"
            title="登出"
          >
            <LogOut className="size-4" />
          </Button>
        ) : (
          <Link href="/login" className="text-muted-foreground hover:text-primary text-xs font-medium transition-colors">
            登录
          </Link>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-9 shrink-0"
          onClick={openSettings}
          aria-label="打开设置"
          title="设置"
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </header>
  );
}

