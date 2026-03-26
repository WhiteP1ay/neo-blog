'use client';

/**
 * 文章管理员菜单：右键与「⋯」下拉共用同一套操作，避免重复 JSX。
 */

import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import type { HomeExplorerCategoryPayload } from '../type/home-explorer-payload';
import { topicToQueryValue } from '../utils/home-explorer';

type PostPreview = HomeExplorerCategoryPayload['posts'][number];

type HomeExplorerPostAdminMenuItemsProps = {
  variant: 'context' | 'dropdown';
  post: PostPreview;
  categories: HomeExplorerCategoryPayload[];
  activeTopicKey: number;
  onEdit: () => void;
  onTogglePin: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMoveTo: (topicKey: number) => void;
};

export function HomeExplorerPostAdminMenuItems({
  variant,
  post,
  categories,
  activeTopicKey,
  onEdit,
  onTogglePin,
  onRename,
  onDelete,
  onMoveTo,
}: HomeExplorerPostAdminMenuItemsProps) {
  if (variant === 'context') {
    return (
      <>
        <ContextMenuItem onSelect={onEdit}>编辑</ContextMenuItem>
        <ContextMenuItem onSelect={onTogglePin}>{post.isPinned ? '取消置顶' : '置顶'}</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>移动到…</ContextMenuSubTrigger>
          <ContextMenuSubContent className="max-h-64 overflow-y-auto">
            {categories.map((cat) => (
              <ContextMenuItem
                key={topicToQueryValue(cat.topicKey)}
                disabled={cat.topicKey === activeTopicKey}
                onSelect={() => onMoveTo(cat.topicKey)}
              >
                {cat.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onSelect={onRename}>重命名</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={onDelete}>
          删除
        </ContextMenuItem>
      </>
    );
  }

  return (
    <>
      <DropdownMenuItem onClick={onEdit}>编辑</DropdownMenuItem>
      <DropdownMenuItem onClick={onTogglePin}>{post.isPinned ? '取消置顶' : '置顶'}</DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>移动到…</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
          {categories.map((cat) => (
            <DropdownMenuItem
              key={topicToQueryValue(cat.topicKey)}
              disabled={cat.topicKey === activeTopicKey}
              onClick={() => onMoveTo(cat.topicKey)}
            >
              {cat.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem onClick={onRename}>重命名</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
        删除
      </DropdownMenuItem>
    </>
  );
}

