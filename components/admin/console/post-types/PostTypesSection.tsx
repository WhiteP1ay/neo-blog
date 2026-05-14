'use client';

import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseAdminJsonResponse, requireAdminOkResponse } from '@/lib/admin-json';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { PostTypeAdminRow } from '../types';

type PostTypesSectionProps = {
  types: PostTypeAdminRow[];
};

function invalidatePostTypesAndPosts(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['admin', 'post-types'] });
  void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
}

/**
 * 类型管理：拖拽排序、行内编辑、创建、删除（仍有文章关联时禁止删）。
 */
export function PostTypesSection({ types }: PostTypesSectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newNameZh, setNewNameZh] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [creating, setCreating] = useState(false);

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await fetch('/api/admin/post-types/reorder', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      }).then((r) => requireAdminOkResponse(r));
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'post-types'] });
      const previous = queryClient.getQueryData<PostTypeAdminRow[]>(['admin', 'post-types']) ?? [];
      if (previous.length > 0) {
        const rank = new Map(orderedIds.map((id, idx) => [id, idx]));
        const next = [...previous]
          .sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
          .map((row, idx) => ({ ...row, sortOrder: idx + 1 }));
        queryClient.setQueryData(['admin', 'post-types'], next);
      }
      return { previous };
    },
    onError: (err, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'post-types'], context.previous);
      }
      showToast(err instanceof Error ? err.message : '排序失败', 'error');
    },
    onSettled: () => {
      invalidatePostTypesAndPosts(queryClient);
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/admin/post-types/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) {
          return r.json().then((j) => Promise.reject(new Error((j as { error?: string }).error ?? '删除失败')));
        }
        return r.json();
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'post-types'] });
      const previous = queryClient.getQueryData<PostTypeAdminRow[]>(['admin', 'post-types']) ?? [];
      queryClient.setQueryData(
        ['admin', 'post-types'],
        previous.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'post-types'], context.previous);
      }
      showToast(err instanceof Error ? err.message : '删除失败', 'error');
    },
    onSuccess: () => {
      showToast('已删除', 'success');
    },
    onSettled: () => {
      invalidatePostTypesAndPosts(queryClient);
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = types.findIndex((t) => t.id === Number(active.id));
    const newIndex = types.findIndex((t) => t.id === Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const moved = arrayMove(types, oldIndex, newIndex);
    try {
      await reorderMutation.mutateAsync(moved.map((t) => t.id));
      showToast('已更新排序', 'success');
    } catch {
      /* onError 已 toast */
    }
  };

  const handleCreate = async () => {
    const code = newCode.trim();
    const nameZh = newNameZh.trim();
    const nameEn = newNameEn.trim();
    if (!code || !nameZh || !nameEn) {
      showToast('请填写类型码与中英文名', 'error');
      return;
    }
    setCreating(true);
    try {
      await fetch('/api/admin/post-types', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code, nameZh, nameEn }),
      }).then((r) => parseAdminJsonResponse<PostTypeAdminRow>(r, true));
      showToast('已创建类型', 'success');
      setCreateOpen(false);
      setNewCode('');
      setNewNameZh('');
      setNewNameEn('');
      invalidatePostTypesAndPosts(queryClient);
    } catch (e) {
      showToast(e instanceof Error ? e.message : '创建失败', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-3 rounded border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">类型管理</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" aria-hidden />
              新建类型
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>新建类型</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label htmlFor="pt-code" className="text-sm font-medium">
                  类型码
                </label>
                <input
                  id="pt-code"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="sql"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pt-nz" className="text-sm font-medium">
                  中文名
                </label>
                <input
                  id="pt-nz"
                  value={newNameZh}
                  onChange={(e) => setNewNameZh(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pt-ne" className="text-sm font-medium">
                  英文名
                </label>
                <input
                  id="pt-ne"
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button type="button" disabled={creating} onClick={() => void handleCreate()}>
                {creating ? '创建中…' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {types.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无类型数据。</p>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
          <SortableContext items={types.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {types.map((row) => (
                <SortableTypeRow
                  key={row.id}
                  row={row}
                  onInvalidate={() => invalidatePostTypesAndPosts(queryClient)}
                  showToast={showToast}
                  onDeleteType={(id) => deleteTypeMutation.mutateAsync(id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

function SortableTypeRow({
  row,
  onInvalidate,
  showToast,
  onDeleteType,
}: {
  row: PostTypeAdminRow;
  onInvalidate: () => void;
  showToast: (msg: string, variant: 'success' | 'error') => void;
  onDeleteType: (id: number) => Promise<unknown>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [nameZh, setNameZh] = useState(row.nameZh);
  const [nameEn, setNameEn] = useState(row.nameEn);
  const [code, setCode] = useState(row.code);
  const [suppress, setSuppress] = useState(row.suppressLinkedPostsGlobally);
  const [saving, setSaving] = useState(false);
  const saveInFlightRef = useRef(false);

  const isDirty = useMemo(
    () =>
      code.trim() !== row.code.trim() ||
      nameZh.trim() !== row.nameZh.trim() ||
      nameEn.trim() !== row.nameEn.trim() ||
      suppress !== row.suppressLinkedPostsGlobally,
    [code, nameZh, nameEn, suppress, row.code, row.nameZh, row.nameEn, row.suppressLinkedPostsGlobally],
  );

  useEffect(() => {
    setNameZh(row.nameZh);
    setNameEn(row.nameEn);
    setCode(row.code);
    setSuppress(row.suppressLinkedPostsGlobally);
  }, [row.nameZh, row.nameEn, row.code, row.suppressLinkedPostsGlobally]);

  const saveIfDirty = useCallback(async () => {
    if (saveInFlightRef.current) return;
    const codeT = code.trim();
    const nameZhT = nameZh.trim();
    const nameEnT = nameEn.trim();
    const dirty =
      codeT !== row.code.trim() ||
      nameZhT !== row.nameZh.trim() ||
      nameEnT !== row.nameEn.trim() ||
      suppress !== row.suppressLinkedPostsGlobally;
    if (!dirty) return;
    if (!codeT || !nameZhT || !nameEnT) {
      showToast('类型码与中英文名不能为空', 'error');
      return;
    }
    saveInFlightRef.current = true;
    setSaving(true);
    try {
      await fetch(`/api/admin/post-types/${row.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: codeT,
          nameZh: nameZhT,
          nameEn: nameEnT,
          suppressLinkedPostsGlobally: suppress,
        }),
      }).then((r) => parseAdminJsonResponse<PostTypeAdminRow>(r, true));
      showToast('已保存', 'success');
      onInvalidate();
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存失败', 'error');
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  }, [
    code,
    nameZh,
    nameEn,
    suppress,
    row.code,
    row.nameZh,
    row.nameEn,
    row.suppressLinkedPostsGlobally,
    row.id,
    showToast,
    onInvalidate,
  ]);

  const handleRowBlur = useCallback(
    (e: React.FocusEvent<HTMLLIElement>) => {
      const next = e.relatedTarget;
      if (next instanceof Node && e.currentTarget.contains(next)) return;
      void saveIfDirty();
    },
    [saveIfDirty],
  );

  const remove = async () => {
    if (!window.confirm(`确定删除类型「${row.code}」？`)) return;
    try {
      await onDeleteType(row.id);
    } catch {
      /* deleteTypeMutation onError */
    }
  };

  const rowDirtyClass =
    isDirty && !isDragging
      ? 'border-amber-500/50 bg-amber-500/[0.06] ring-1 ring-amber-500/35 dark:bg-amber-500/10'
      : '';

  return (
    <li
      ref={setNodeRef}
      style={style}
      tabIndex={-1}
      aria-busy={saving}
      onBlur={handleRowBlur}
      className={`flex flex-col gap-2 rounded-md border bg-card p-3 sm:flex-row sm:items-end ${isDragging ? 'opacity-70 shadow-md' : ''} ${rowDirtyClass}`}
    >
      <span className="sr-only" aria-live="polite">
        {isDirty ? '本行有未保存的修改，移出焦点将自动保存。' : ''}
      </span>
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={saving}
        className="cursor-grab touch-none self-start rounded border bg-muted/40 px-2 py-2 text-muted-foreground active:cursor-grabbing enabled:hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40 sm:self-end"
        aria-label="拖拽排序"
        title="拖拽排序"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">类型码</span>
          <input
            value={code}
            readOnly={saving}
            onChange={(e) => setCode(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none read-only:opacity-70 focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">中文名</span>
          <input
            value={nameZh}
            readOnly={saving}
            onChange={(e) => setNameZh(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none read-only:opacity-70 focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">英文名</span>
          <input
            value={nameEn}
            readOnly={saving}
            onChange={(e) => setNameEn(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none read-only:opacity-70 focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:pb-0.5">
        {isDirty ? <span className="text-xs font-medium text-amber-700 dark:text-amber-400">未保存</span> : null}
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-input"
            checked={suppress}
            disabled={saving}
            onChange={(e) => setSuppress(e.target.checked)}
          />
          全站隐藏关联文章
        </label>
        {isDirty || saving ? (
          <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => void saveIfDirty()}>
            {saving ? '保存中…' : '保存'}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive"
          disabled={saving}
          aria-label="删除类型"
          onClick={() => void remove()}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}
