'use client';

import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical, Pencil, Trash2, Wrench } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import type { PostItem } from '../../types';
import { RichTextEditor } from '../RichTextEditor';

type PostTableProps = {
  posts: PostItem[];
  form: {
    editingPostId: number | null;
    editPostTitle: string;
    setEditPostTitle: (value: string) => void;
    editPostContent: string;
    setEditPostContent: (value: string) => void;
    editPostType: string;
    setEditPostType: (value: string) => void;
    editPostIsHidden: boolean;
    setEditPostIsHidden: (value: boolean) => void;
    editPostExcerpt: string;
    setEditPostExcerpt: (value: string) => void;
    editPostCoverUrl: string;
    setEditPostCoverUrl: (value: string) => void;
    togglePostHidden: (item: PostItem) => Promise<void>;
    deletePost: (id: number) => Promise<void>;
    startEditPost: (post: PostItem) => Promise<void>;
    cancelEditPost: () => void;
    savePostEdit: () => Promise<void>;
    reorderPosts: (orderedIds: number[]) => Promise<void>;
  };
};

export function PostTable({ posts, form }: PostTableProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const orderedPosts = useMemo(
    () => [...posts].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [posts],
  );
  const types = useMemo(
    () => Array.from(new Set(orderedPosts.map((post) => post.type))).sort((a, b) => a.localeCompare(b)),
    [orderedPosts],
  );
  const visiblePosts = useMemo(() => {
    if (selectedTypes.length === 0) return orderedPosts;
    return orderedPosts.filter((post) => selectedTypes.includes(post.type));
  }, [orderedPosts, selectedTypes]);

  const toggleType = (type: string) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (selectedTypes.length > 0) return;
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
        <p className="mb-2 text-xs text-muted-foreground">按类型筛选（不选=全部）</p>
        <div className="flex flex-wrap gap-3">
          {types.map((type) => (
            <label key={type || '__empty'} className="inline-flex items-center gap-1 text-sm">
              <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} />
              {type || '(空)'}
            </label>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-visible rounded border">
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
                <th className="px-3 py-2">
                  <Eye className="h-4 w-4" aria-label="显示状态列" />
                </th>
                <th className="px-3 py-2">
                  <Wrench className="h-4 w-4" aria-label="操作列" />
                </th>
              </tr>
            </thead>
            <SortableContext items={visiblePosts.map((post) => post.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {visiblePosts.map((post) => (
                  <SortablePostRow key={post.id} post={post} form={form} dragDisabled={selectedTypes.length > 0} />
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
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: post.id, disabled: dragDisabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Fragment>
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
          <button
            className="rounded border px-2 py-1"
            type="button"
            onClick={() => void form.togglePostHidden(post)}
            aria-label={post.isHidden ? '切换为显示' : '切换为隐藏'}
            title={post.isHidden ? '切换为显示' : '切换为隐藏'}
          >
            {post.isHidden ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-emerald-600" />
            )}
          </button>
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
      {form.editingPostId === post.id ? (
        <tr className="border-b bg-muted/20">
          <td className="px-3 py-3" colSpan={6}>
            <div className="space-y-2 rounded border border-dashed p-3">
              <input className="w-full rounded border px-2 py-1" placeholder="标题" value={form.editPostTitle} onChange={(e) => form.setEditPostTitle(e.target.value)} />
              <input className="w-full rounded border px-2 py-1" placeholder="类型" value={form.editPostType} onChange={(e) => form.setEditPostType(e.target.value)} />
              <input className="w-full rounded border px-2 py-1" placeholder="封面 URL（可选）" value={form.editPostCoverUrl} onChange={(e) => form.setEditPostCoverUrl(e.target.value)} />
              <textarea className="h-20 w-full rounded border px-2 py-1" placeholder="摘要（可选）" value={form.editPostExcerpt} onChange={(e) => form.setEditPostExcerpt(e.target.value)} />
              <label className="inline-flex items-center gap-1">
                <input type="checkbox" checked={form.editPostIsHidden} onChange={(e) => form.setEditPostIsHidden(e.target.checked)} />
                隐藏
              </label>
              <div className="max-h-[70vh] overflow-y-auto">
                <RichTextEditor
                  value={form.editPostContent}
                  onChange={form.setEditPostContent}
                  placeholder="编辑正文（HTML）"
                  toolbarRight={
                    <>
                      <button className="rounded border px-2 py-1 text-xs" type="button" onClick={form.cancelEditPost}>
                        取消
                      </button>
                      <button
                        className="rounded border border-primary bg-primary px-2 py-1 text-xs text-primary-foreground"
                        type="button"
                        onClick={() => void form.savePostEdit()}
                      >
                        保存
                      </button>
                    </>
                  }
                />
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}
