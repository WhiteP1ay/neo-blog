'use client';

/**
 * 中间文章列表面板：支持拖拽上传 markdown、管理员菜单、管理员拖拽排序。
 */

import type { ChangeEvent, DragEventHandler, RefObject } from 'react';
import { FilePlus, MoreHorizontal, Upload } from 'lucide-react';
import { PostDndList } from './ExplorerSortables';
import { PostAdminMenuItems } from './PostAdminMenuItems';
import { PostRowBody } from './PostRowBody';
import type { HomeExplorerCategoryPayload } from '../type/payload';
import { cn } from '@/lib/utils';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLayoutStore } from '../store/layout';
import { useAdminUiStore } from '../store/admin-ui';

export type PostListPanelProps = {
  isAdminLoggedIn: boolean;
  listDropHandlers: {
    onDragEnter?: DragEventHandler<HTMLElement>;
    onDragLeave?: DragEventHandler<HTMLElement>;
    onDragOver?: DragEventHandler<HTMLElement>;
    onDrop?: DragEventHandler<HTMLElement>;
  };
  activeCategory: HomeExplorerCategoryPayload | undefined;
  categories: HomeExplorerCategoryPayload[];
  posts: HomeExplorerCategoryPayload['posts'];
  activePostId: number | null;
  uploadFileInputRef: RefObject<HTMLInputElement | null>;
  onUploadInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onCreatePost: () => void;
  onTriggerUploadClick: () => void;
  navigatePost: (topicKey: number, postId: number) => void;
  refreshExplorer: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  openPostEditor: (topicKey: number, postId: number) => void;
  handleTogglePostPin: (postId: number, nextPinned: boolean) => void | Promise<void>;
  handleMovePost: (postId: number, target: number) => void | Promise<void>;
  onRenamePost: (id: number, title: string) => void;
  onDeletePost: (id: number) => void;
};

export function PostListPanel({
  isAdminLoggedIn,
  listDropHandlers,
  activeCategory,
  categories,
  posts,
  activePostId,
  uploadFileInputRef,
  onUploadInputChange,
  onCreatePost,
  onTriggerUploadClick,
  navigatePost,
  refreshExplorer,
  showToast,
  openPostEditor,
  handleTogglePostPin,
  handleMovePost,
  onRenamePost,
  onDeletePost,
}: PostListPanelProps) {
  const listPx = useLayoutStore((s) => s.listPx);
  const listDropActive = useAdminUiStore((s) => s.listDropActive);
  const topicKey = activeCategory?.topicKey ?? 0;

  const postMenuProps = (post: HomeExplorerCategoryPayload['posts'][number]) => ({
    post,
    categories,
    activeTopicKey: topicKey,
    onEdit: () => openPostEditor(topicKey, post.id),
    onTogglePin: () => void handleTogglePostPin(post.id, !post.isPinned),
    onRename: () => onRenamePost(post.id, post.title),
    onDelete: () => onDeletePost(post.id),
    onMoveTo: (target: number) => void handleMovePost(post.id, target),
  });

  return (
    <section
      className="relative flex min-w-0 shrink-0 flex-col bg-muted/15"
      style={{ width: listPx }}
      aria-label="文章列表"
      onDragEnter={listDropHandlers.onDragEnter}
      onDragLeave={listDropHandlers.onDragLeave}
      onDragOver={listDropHandlers.onDragOver}
      onDrop={listDropHandlers.onDrop}
    >
      {isAdminLoggedIn && listDropActive ? (
        <div
          className="pointer-events-none absolute inset-1 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10"
          aria-hidden
        >
          <span className="text-primary px-2 text-center text-sm font-medium">释放以上传 Markdown</span>
        </div>
      ) : null}
      <div className="border-border flex flex-row items-center justify-between gap-2 border-b px-3 py-2">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {activeCategory?.name ?? '文章'}
        </span>
        {isAdminLoggedIn ? (
          <div className="flex shrink-0 items-center gap-1">
            <input
              ref={uploadFileInputRef}
              type="file"
              accept=".md,text/markdown"
              className="hidden"
              aria-hidden
              onChange={onUploadInputChange}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              aria-label="新建文章"
              title="新建文章"
              onClick={() => void onCreatePost()}
            >
              <FilePlus className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              aria-label="上传 Markdown 文章"
              title="上传 Markdown（可拖入本栏）"
              onClick={onTriggerUploadClick}
            >
              <Upload className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {posts.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">此分类下暂无文章</p>
        ) : isAdminLoggedIn && activeCategory && activeCategory.topicKey !== 0 ? (
          <div role="listbox" aria-label={`${activeCategory.name}下的条目`} className="flex flex-col gap-0.5">
            <PostDndList
              topicId={activeCategory.topicKey}
              posts={posts}
              activePostId={activePostId}
              onOrderSaved={refreshExplorer}
              showToast={showToast}
              renderPostRow={({ post, selected, dragHandle }) => (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        'group/post flex w-full items-stretch gap-0.5 rounded-md transition-colors',
                        selected ? 'bg-primary/15 text-foreground ring-1 ring-primary/20' : 'hover:bg-accent/50 text-foreground/90',
                      )}
                    >
                      {dragHandle}
                      <button
                        type="button"
                        role="option"
                        className="flex min-w-0 flex-1 flex-col gap-1 rounded-md px-2 py-2.5 text-left text-sm"
                        onClick={() => navigatePost(activeCategory.topicKey, post.id)}
                        aria-selected={selected}
                      >
                        <PostRowBody post={post} />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground size-8 shrink-0 self-center opacity-0 transition-opacity group-hover/post:opacity-100"
                            aria-label={`「${post.title}」更多`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <PostAdminMenuItems variant="dropdown" {...postMenuProps(post)} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-52">
                    <PostAdminMenuItems variant="context" {...postMenuProps(post)} />
                  </ContextMenuContent>
                </ContextMenu>
              )}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-0.5" role="listbox" aria-label={`${activeCategory?.name ?? '文章'}下的条目`}>
            {posts.map((post) => {
              const selected = activePostId === post.id;
              const rowToneClass = cn(
                selected ? 'bg-primary/15 text-foreground font-medium ring-1 ring-primary/20' : 'hover:bg-accent/50 text-foreground/90',
              );
              const rowClass = cn(
                'flex w-full flex-col gap-1 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors',
                rowToneClass,
              );
              if (!isAdminLoggedIn) {
                return (
                  <button
                    key={post.id}
                    type="button"
                    role="option"
                    onClick={() => navigatePost(topicKey, post.id)}
                    className={rowClass}
                    aria-selected={selected}
                  >
                    <PostRowBody post={post} />
                  </button>
                );
              }
              return (
                <ContextMenu key={post.id}>
                  <ContextMenuTrigger asChild>
                    <div className={cn('group/post flex items-stretch gap-0.5 rounded-md', rowToneClass)}>
                      <button
                        type="button"
                        role="option"
                        onClick={() => navigatePost(topicKey, post.id)}
                        className="flex min-w-0 flex-1 flex-col gap-1 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors"
                        aria-selected={selected}
                      >
                        <PostRowBody post={post} />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground size-8 shrink-0 self-center opacity-0 transition-opacity group-hover/post:opacity-100"
                            aria-label={`「${post.title}」更多`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <PostAdminMenuItems variant="dropdown" {...postMenuProps(post)} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-52">
                    <PostAdminMenuItems variant="context" {...postMenuProps(post)} />
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

