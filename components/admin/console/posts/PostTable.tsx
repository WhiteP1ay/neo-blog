'use client';

import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, GripVertical, Pencil, Sparkles, Trash2, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { ADMIN_REORDER_UNCATEGORIZED_TYPE_ID } from '@/lib/admin-post-constants';
import { adminPostsListPath } from '@/lib/blog-list-query';
import type { PostItem, PostTypeAdminRow } from '../types';

type PostTableProps = {
  posts: PostItem[];
  /** 全量类型目录（用于 Tab 顺序与 code→id）；与 `/api/admin/post-types` 一致 */
  typeCatalog: PostTypeAdminRow[];
  /** 路径同步的类型筛选：null 或 undefined 表示显示全部；空串表示未分类 */
  selectedType?: string | null;
  form: {
    togglePostHidden: (item: PostItem) => Promise<void>;
    deletePost: (id: number) => Promise<void>;
    startEditPost: (post: PostItem) => Promise<void>;
    reorderPosts: (orderedIds: number[], typeId: number) => Promise<void>;
    openAiPolish: (post: PostItem) => void;
  };
};

const iconBtnMobile =
  'inline-flex min-h-10 min-w-10 touch-manipulation items-center justify-center rounded border sm:min-h-0 sm:min-w-0 sm:px-2 sm:py-1';

const filterLinkClass =
  'min-h-10 touch-manipulation rounded border px-3 py-2 text-sm leading-none hover:bg-muted sm:min-h-0 sm:px-2 sm:py-1';

function postInSelectedBucket(post: PostItem, selectedCode: string): boolean {
  if (selectedCode === '') {
    return post.types.length === 0;
  }
  return post.types.some((t) => t.code === selectedCode);
}

function formatTypesCell(post: PostItem): string {
  if (post.types.length === 0) return '(空)';
  return post.types.map((t) => t.nameZh).join('、');
}

/** 移动端卡片内：前台显示 + 预览 + 编辑 + 删除 */
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
      <Link
        className={iconBtnMobile}
        href={`/blog/${post.id}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="预览"
        title="预览"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <button
        className={iconBtnMobile}
        type="button"
        onClick={() => form.openAiPolish(post)}
        aria-label="AI 润色"
        title="AI 润色"
      >
        <Sparkles className="h-4 w-4" />
      </button>
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

export function PostTable({ posts, typeCatalog, form, selectedType = null }: PostTableProps) {
  const orderedPosts = useMemo(() => [...posts].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id), [posts]);

  const codesInPosts = useMemo(() => {
    const set = new Set<string>();
    for (const p of orderedPosts) {
      for (const t of p.types) {
        set.add(t.code);
      }
    }
    return set;
  }, [orderedPosts]);

  const hasUncategorized = useMemo(() => orderedPosts.some((p) => p.types.length === 0), [orderedPosts]);

  const filterTabs = useMemo(() => {
    const rows = typeCatalog
      .filter((t) => codesInPosts.has(t.code))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    return rows;
  }, [typeCatalog, codesInPosts]);

  const reorderTypeId = useMemo(() => {
    if (selectedType === null || selectedType === undefined) return null;
    if (selectedType === '') return ADMIN_REORDER_UNCATEGORIZED_TYPE_ID;
    const row = typeCatalog.find((t) => t.code === selectedType);
    return row?.id ?? null;
  }, [selectedType, typeCatalog]);

  const visiblePosts = useMemo(() => {
    if (selectedType === null || selectedType === undefined) return orderedPosts;
    return orderedPosts.filter((post) => postInSelectedBucket(post, selectedType));
  }, [orderedPosts, selectedType]);

  const isFiltering = selectedType !== null && selectedType !== undefined;
  const dragEnabled = isFiltering && reorderTypeId !== null;

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!dragEnabled || reorderTypeId === null) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visiblePosts.findIndex((post) => post.id === Number(active.id));
    const newIndex = visiblePosts.findIndex((post) => post.id === Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const moved = arrayMove(visiblePosts, oldIndex, newIndex);
    await form.reorderPosts(
      moved.map((post) => post.id),
      reorderTypeId,
    );
  };

  return (
    <div className="space-y-3">
      <div className="rounded border p-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={adminPostsListPath(null)}
            scroll={false}
            className={`${filterLinkClass} ${!isFiltering ? 'bg-muted font-medium' : ''}`}
            aria-current={!isFiltering ? 'page' : undefined}
          >
            全部
          </Link>
          {filterTabs.map((t) => {
            const active = isFiltering && selectedType === t.code;
            return (
              <Link
                key={t.code}
                href={adminPostsListPath(t.code)}
                scroll={false}
                className={`${filterLinkClass} ${active ? 'bg-muted font-medium' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {t.nameZh}
              </Link>
            );
          })}
          {hasUncategorized ? (
            <Link
              key="__uncat"
              href={adminPostsListPath('')}
              scroll={false}
              className={`${filterLinkClass} ${isFiltering && selectedType === '' ? 'bg-muted font-medium' : ''}`}
              aria-current={isFiltering && selectedType === '' ? 'page' : undefined}
            >
              未分类
            </Link>
          ) : null}
        </div>
      </div>

      {!isFiltering ? (
        <p className="text-xs text-muted-foreground">仅支持分类内拖拽排序，请先点击上方某个分类后再调整顺序。</p>
      ) : null}
      {isFiltering && visiblePosts.length > 1 ? (
        <p className="text-xs text-muted-foreground md:hidden">调整排序请在平板或电脑上使用左侧拖拽手柄。</p>
      ) : null}

      <div className="space-y-3 md:hidden">
        {visiblePosts.map((post) => (
          <div key={post.id} className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="min-w-0 space-y-1">
              <p className="wrap-break-word font-medium leading-snug">{post.title}</p>
              <p className="text-xs text-muted-foreground">
                ID {post.id} · {formatTypesCell(post)} · {post.isHidden ? '隐藏' : '显示'}
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
                  <SortablePostRow key={post.id} post={post} form={form} dragDisabled={!dragEnabled} />
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
          title={dragDisabled ? '请先选中某个分类后再调整顺序' : '拖拽排序（同分类内）'}
          aria-label={dragDisabled ? '请先选中某个分类后再调整顺序' : '拖拽排序（同分类内）'}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-3 py-2">{post.id}</td>
      <td className="px-3 py-2">{post.title}</td>
      <td className="max-w-[12rem] truncate px-3 py-2" title={formatTypesCell(post)}>
        {formatTypesCell(post)}
      </td>
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
          <Link
            className="inline-flex items-center justify-center rounded border px-2 py-1"
            href={`/blog/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="预览"
            title="预览"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            className="rounded border px-2 py-1"
            type="button"
            onClick={() => form.openAiPolish(post)}
            aria-label="AI 润色"
            title="AI 润色"
          >
            <Sparkles className="h-4 w-4" />
          </button>
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
