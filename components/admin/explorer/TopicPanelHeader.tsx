'use client';

/**
 * 专题栏头部：展开/收起切换 + 标题 +（管理员）新建专题入口。
 */

import { PanelLeftClose, PanelRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TopicPanelHeaderProps = {
  expanded: boolean;
  isAdminLoggedIn: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onCreateTopic: () => void;
  className?: string;
};

export function TopicPanelHeader({
  expanded,
  isAdminLoggedIn,
  onCollapse,
  onExpand,
  onCreateTopic,
  className,
}: TopicPanelHeaderProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1 border-b border-white/20 px-2 py-2 dark:border-white/10',
        expanded ? 'justify-between' : 'justify-center',
        className,
      )}
    >
      {expanded ? (
        <>
          <div className="flex min-w-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground size-8 shrink-0"
              onClick={onCollapse}
              aria-label="收起专题栏"
              title="收起专题栏"
            >
              <PanelLeftClose className="size-4" />
            </Button>
            <span className="text-muted-foreground truncate text-xs font-semibold uppercase tracking-wide">专题</span>
          </div>
          {isAdminLoggedIn ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              aria-label="新建专题"
              title="新建专题"
              onClick={onCreateTopic}
            >
              <Plus className="size-4" />
            </Button>
          ) : null}
        </>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-9 shrink-0"
          onClick={onExpand}
          aria-label="展开专题栏"
          title="展开专题栏"
        >
          <PanelRight className="size-4" />
        </Button>
      )}
    </div>
  );
}

