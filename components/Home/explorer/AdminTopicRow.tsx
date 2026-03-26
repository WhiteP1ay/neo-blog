'use client';

/**
 * 分类 管理员操作（拖拽柄 + 标题 + 置顶 + 菜单）。
 */

import type { ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { HomeExplorerCategoryPayload } from '../type/payload';
import { cn } from '@/lib/utils';

export type AdminTopicRowProps = {
  cat: HomeExplorerCategoryPayload;
  isActive: boolean;
  dragHandle: ReactNode;
  onNavigate: () => void;
  onTogglePin: () => void;
  onRename: () => void;
  onDelete: () => void;
};

export function AdminTopicRow({ cat, isActive, dragHandle, onNavigate, onTogglePin, onRename, onDelete }: AdminTopicRowProps) {
  return (
    <div className={cn('group/topic flex w-full items-center gap-0.5 rounded-md', isActive ? 'bg-accent/80' : 'hover:bg-accent/40')}>
      {dragHandle}
      <button
        type="button"
        onClick={onNavigate}
        className={cn(
          'pin-btn flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
          isActive ? 'text-accent-foreground font-medium' : 'text-foreground/90',
        )}
        aria-current={isActive ? 'true' : undefined}
      >
        <span className="min-w-0 flex-1 truncate">{cat.name}</span>
        {cat.isPinned ? (
          <Badge variant="outline" className="shrink-0 border-amber-500/40 px-1 py-0 text-[10px] text-amber-800 dark:text-amber-200">
            置顶
          </Badge>
        ) : null}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8 shrink-0 opacity-0 transition-opacity group-hover/topic:opacity-100"
            aria-label={`「${cat.name}」更多`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onTogglePin}>{cat.isPinned ? '取消置顶' : '置顶'}</DropdownMenuItem>
          <DropdownMenuItem onClick={onRename}>重命名</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

