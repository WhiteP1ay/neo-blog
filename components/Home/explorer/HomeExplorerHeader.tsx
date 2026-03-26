'use client';

/**
 * Home Explorer 顶部栏（标题/导航/设置入口）。
 */

import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/server/actions/login';
import { useHomeExplorerLayoutStore } from '../store/home-explorer-layout-store';

interface HomeExplorerHeaderProps {
  isAdminLoggedIn: boolean;
}

export function HomeExplorerHeader({ isAdminLoggedIn }: HomeExplorerHeaderProps) {
  const openSettings = useHomeExplorerLayoutStore((s) => s.openSettings);

  return (
    <header className="border-border bg-muted/40 shrink-0 border-b">
      <div className="flex h-10 items-center gap-3 px-4">
        <Link href="/" className="truncate text-base font-bold text-foreground">
          White Meta
        </Link>
        {/* @todo “文件”下拉框，支持导出当前所选的博客文章为markdown文件 */}
        <Link href="/blog" className="text-muted-foreground hover:text-primary text-xs font-medium transition-colors">
          旧版博客
        </Link>
        {isAdminLoggedIn ? null : (
          <Link href="/login" className="text-muted-foreground hover:text-primary text-xs font-medium transition-colors">
            登录
          </Link>
        )}

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
        ) : null}
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

