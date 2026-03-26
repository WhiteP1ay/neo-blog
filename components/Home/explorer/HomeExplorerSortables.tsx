'use client';

/**
 * Home Explorer DnD 组件集合（专题排序、文章排序）。
 *
 * 说明：
 * - 仅封装 @dnd-kit 的交互与排序保存逻辑
 * - 具体行渲染由 render props 提供，保持 UI 复用
 */

import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { updateTopicPostSortOrder, updateTopicsSortOrder } from '@/server/actions/topics';
import { cn } from '@/lib/utils';
import type { HomeExplorerCategoryPayload } from '../type/home-explorer-payload';
import { topicToQueryValue } from '../utils/home-explorer';

const POINTER_ACTIVATION_PX = 8;

function useExplorerDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_ACTIVATION_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

type SortableTopicShellProps = {
  id: number;
  children: (args: {
    setActivatorNodeRef: (el: HTMLElement | null) => void;
    attributes: DraggableAttributes;
    listeners: Record<string, unknown> | undefined;
  }) => React.ReactNode;
};

function SortableTopicShell({ id, children }: SortableTopicShellProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="list-none">
      {children({ setActivatorNodeRef, attributes, listeners })}
    </li>
  );
}

export type HomeExplorerTopicDndGroupProps = {
  /** 稳定唯一，避免 @dnd-kit 模块级 id 计数在 SSR/客户端不一致导致水合报错 */
  dndContextId: string;
  topics: HomeExplorerCategoryPayload[];
  activeTopicQuery: string;
  onOrderSaved: () => void;
  showToast: (message: string, variant: 'success' | 'error' | 'warning') => void;
  renderTopicRow: (args: {
    cat: HomeExplorerCategoryPayload;
    isActive: boolean;
    dragHandle: React.ReactNode;
  }) => React.ReactNode;
};

/**
 * 一组同 isPinned 的专题：内部可拖拽改 sortOrder
 */
export function HomeExplorerTopicDndGroup({
  dndContextId,
  topics,
  activeTopicQuery,
  onOrderSaved,
  showToast,
  renderTopicRow,
}: HomeExplorerTopicDndGroupProps) {
  const sensors = useExplorerDndSensors();
  const ids = topics.map((t) => t.topicKey);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = ids.indexOf(active.id as number);
      const newIndex = ids.indexOf(over.id as number);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      const reordered = arrayMove(topics, oldIndex, newIndex);
      const topicOrders = reordered.map((c, i) => ({
        topicId: c.topicKey,
        sortOrder: i,
      }));
      const r = await updateTopicsSortOrder(topicOrders);
      if (!r.success) {
        showToast(r.error ?? '更新专题顺序失败', 'error');
        return;
      }
      onOrderSaved();
    },
    [ids, onOrderSaved, showToast, topics],
  );

  if (topics.length === 0) {
    return null;
  }

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => void handleDragEnd(e)}
    >
      <SortableContext id={`${dndContextId}-sortable`} items={ids} strategy={verticalListSortingStrategy}>
        {topics.map((cat) => {
          const q = topicToQueryValue(cat.topicKey);
          const isActive = q === activeTopicQuery;
          const tid = cat.topicKey;
          return (
            <SortableTopicShell key={tid} id={tid}>
              {({ setActivatorNodeRef, attributes, listeners }) => (
                <>
                  {renderTopicRow({
                    cat,
                    isActive,
                    dragHandle: (
                      <button
                        type="button"
                        ref={setActivatorNodeRef}
                        className={cn(
                          'text-muted-foreground hover:text-foreground touch-none shrink-0 rounded-md p-1',
                          'cursor-grab active:cursor-grabbing',
                        )}
                        aria-label="拖动排序"
                        {...attributes}
                        {...listeners}
                      >
                        <GripVertical className="size-4" aria-hidden />
                      </button>
                    ),
                  })}
                </>
              )}
            </SortableTopicShell>
          );
        })}
      </SortableContext>
    </DndContext>
  );
}

type PostPreview = HomeExplorerCategoryPayload['posts'][number];

type SortablePostShellProps = {
  id: number;
  children: (args: {
    setActivatorNodeRef: (el: HTMLElement | null) => void;
    attributes: DraggableAttributes;
    listeners: Record<string, unknown> | undefined;
  }) => React.ReactNode;
};

function SortablePostShell({ id, children }: SortablePostShellProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      {children({ setActivatorNodeRef, attributes, listeners })}
    </div>
  );
}

export type HomeExplorerPostDndListProps = {
  topicId: number;
  posts: PostPreview[];
  activePostId: number | null;
  onOrderSaved: () => void;
  showToast: (message: string, variant: 'success' | 'error' | 'warning') => void;
  renderPostRow: (args: {
    post: PostPreview;
    selected: boolean;
    dragHandle: React.ReactNode;
  }) => React.ReactNode;
};

/**
 * 专题内文章列表拖拽排序（依赖 topic_posts.sortOrder）
 */
export function HomeExplorerPostDndList({
  topicId,
  posts,
  activePostId,
  onOrderSaved,
  showToast,
  renderPostRow,
}: HomeExplorerPostDndListProps) {
  const sensors = useExplorerDndSensors();
  const ids = posts.map((p) => p.id);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = ids.indexOf(active.id as number);
      const newIndex = ids.indexOf(over.id as number);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      const reordered = arrayMove(posts, oldIndex, newIndex);
      const postOrders = reordered.map((p, i) => ({ postId: p.id, sortOrder: i }));
      const r = await updateTopicPostSortOrder(topicId, postOrders);
      if (!r.success) {
        showToast(r.error ?? '更新文章顺序失败', 'error');
        return;
      }
      onOrderSaved();
    },
    [ids, onOrderSaved, posts, showToast, topicId],
  );

  const dndContextId = `home-explorer-posts-${topicId}`;

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => void handleDragEnd(e)}
    >
      <SortableContext id={`${dndContextId}-sortable`} items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-0.5">
          {posts.map((post) => (
            <SortablePostShell key={post.id} id={post.id}>
              {({ setActivatorNodeRef, attributes, listeners }) =>
                renderPostRow({
                  post,
                  selected: activePostId === post.id,
                  dragHandle: (
                    <button
                      type="button"
                      ref={setActivatorNodeRef}
                      className={cn(
                        'text-muted-foreground hover:text-foreground touch-none shrink-0 rounded-md p-1',
                        'cursor-grab active:cursor-grabbing',
                      )}
                      aria-label="拖动排序"
                      {...attributes}
                      {...listeners}
                    >
                      <GripVertical className="size-4" aria-hidden />
                    </button>
                  ),
                })
              }
            </SortablePostShell>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

