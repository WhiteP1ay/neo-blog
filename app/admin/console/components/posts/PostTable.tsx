'use client';

import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { encodeTopicPathSegment } from '@/lib/url/segmentEncoding';
import type { PostItem } from '../../types';

type PostTableProps = {
  posts: PostItem[];
  /** 路径同步的类型筛选：null 或 undefined 表示显示全部 */
  selectedType?: string | null;
  form: {
    togglePostHidden: (item: PostItem) => Promise<void>;
    deletePost: (id: number) => Promise<void>;
    startEditPost: (post: PostItem) => Promise<void>;
    reorderPosts: (orderedIds: number[]) => Promise<void>;
  };
};

const ADMIN_POSTS_BASE = '/admin/posts';

const iconBtnMobile =
  'inline-flex min-h-10 min-w-10 touch-manipulation items-center justify-center rounded border sm:min-h-0 sm:min-w-0 sm:px-2 sm:py-1';

const filterLinkClass =
  'min-h-10 touch-manipulation rounded border px-3 py-2 text-sm leading-none hover:bg-muted sm:min-h-0 sm:px-2 sm:py-1';

/** 移动端卡片内：前台显示 + 编辑 + 删除 */
function PostCardActions({ post, form }: { post: PostItem; form: PostTableProps['form'] }) {
  const switchId = `post-visible-${post.id}`;
  return (
    <>
      <div className="flex items-center gap-2">
        <Switch
          id={switchId}
          checked={!post.isHidden}
          onCheckedChange={() => void form.togglePostHidden(post)}
          aria-label="前台显示"
        />
        <label htmlFor={switchId} className="cursor-pointer select-none text-xs text-muted-foreground">
          前台显示
        </label>
      </div>
      <button
        className={iconBtnMobile}
        type="button"
        onClick={() => void form.startEditPost(post)}
        aria-label="编辑"
        title="编辑"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        className={iconBtnMobile}
        type="button"
        onClick={() => void form.deletePost(post.id)}
        aria-label="删除"
        title="删除"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );
}

export function PostTable({ posts, form, selectedType = null }: PostTableProps) {
  const orderedPosts = useMemo(() => [...posts].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id), [posts]);
  const types = useMemo(
    () => Array.from(new Set(orderedPosts.map((post) => post.type))).sort((a, b) => a.localeCompare(b)),
    [orderedPosts],
  );
  const visiblePosts = useMemo(() => {
    if (selectedType === null || selectedType === undefined) return orderedPosts;
    return orderedPosts.filter((post) => post.type === selectedType);
  }, [orderedPosts, selectedType]);

  const isFiltering = selectedType !== null && selectedType !== undefined;

  const handleDragEnd = async (event: DragEndEvent) => {
    if (isFiltering) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedPosts.findIndex((post) => post.id === Number(active.id));
    const newIndex = orderedPosts.findIndex((post) => post.id === Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const moved = arrayMove(orderedPosts, oldIndex, newIndex);
    await form.reorderPosts(moved.map((post) => post.id));
  };

  return (
    <div className="space-y-3">
      <div className="rounded border p-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={ADMIN_POSTS_BASE}
            scroll={false}
            className={`${filterLinkClass} ${!isFiltering ? 'bg-muted font-medium' : ''}`}
            aria-current={!isFiltering ? 'page' : undefined}
          >
            全部
          </Link>
          {types.map((type) => {
            const active = isFiltering && selectedType === type;
            return (
              <Link
                key={type || '__empty'}
                href={`${ADMIN_POSTS_BASE}/type/${encodeTopicPathSegment(type)}`}
                scroll={false}
                className={`${filterLinkClass} ${active ? 'bg-muted font-medium' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {type || '(空)'}
              </Link>
            );
          })}
        </div>
      </div>

      {!isFiltering && visiblePosts.length > 1 ? (
        <p className="text-xs text-muted-foreground md:hidden">调整排序请在平板或电脑上使用左侧拖拽手柄。</p>
      ) : null}

      <div className="space-y-3 md:hidden">
        {visiblePosts.map((post) => (
          <div key={post.id} className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="min-w-0 space-y-1">
              <p className="wrap-break-word font-medium leading-snug">{post.title}</p>
              <p className="text-xs text-muted-foreground">
                ID {post.id} · {post.type || '(空)'} · {post.isHidden ? '隐藏' : '显示'}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PostCardActions post={post} form={form} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto overflow-y-visible rounded border md:block">
        <DndContext collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-3 py-2">
                  <GripVertical className="h-4 w-4" aria-label="拖拽排序列" />
                </th>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">标题</th>
                <th className="px-3 py-2">类型</th>
                <th className="px-3 py-2">前台显示</th>
                <th className="px-3 py-2">
                  <Wrench className="h-4 w-4" aria-label="操作列" />
                </th>
              </tr>
            </thead>
            <SortableContext items={visiblePosts.map((post) => post.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {visiblePosts.map((post) => (
                  <SortablePostRow key={post.id} post={post} form={form} dragDisabled={isFiltering} />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>
    </div>
  );
}

function SortablePostRow({
  post,
  form,
  dragDisabled,
}: {
  post: PostItem;
  form: PostTableProps['form'];
  dragDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: post.id,
    disabled: dragDisabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const switchId = `post-row-visible-${post.id}`;

  return (
    <tr ref={setNodeRef} style={style} className="border-b">
      <td className="px-3 py-2">
        <button
          className="cursor-grab rounded border px-2 py-1 text-xs disabled:cursor-not-allowed"
          type="button"
          {...attributes}
          {...listeners}
          disabled={dragDisabled}
          title={dragDisabled ? '筛选状态下暂不可拖拽排序' : '拖拽排序'}
          aria-label={dragDisabled ? '筛选状态下暂不可拖拽排序' : '拖拽排序'}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-3 py-2">{post.id}</td>
      <td className="px-3 py-2">{post.title}</td>
      <td className="px-3 py-2">{post.type || '(空)'}</td>
      <td className="px-3 py-2">
        <Switch
          id={switchId}
          checked={!post.isHidden}
          onCheckedChange={() => void form.togglePostHidden(post)}
          aria-label="前台显示"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <button
            className="rounded border px-2 py-1"
            type="button"
            onClick={() => void form.startEditPost(post)}
            aria-label="编辑"
            title="编辑"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="rounded border px-2 py-1"
            type="button"
            onClick={() => void form.deletePost(post.id)}
            aria-label="删除"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
