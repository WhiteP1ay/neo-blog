'use client';

import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import type { HomeFeaturedItem } from '../types';

type HomeFeaturedDndProps = {
  items: HomeFeaturedItem[];
  onReorder: (orderedIds: number[]) => Promise<void> | void;
  onRemove: (id: number) => Promise<void> | void;
};

/**
 * 已精选文章列表（DnD 排序 + 移除）。
 */
export function HomeFeaturedDnd({ items, onReorder, onRemove }: HomeFeaturedDndProps) {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === Number(active.id));
    const newIndex = items.findIndex((item) => item.id === Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const moved = arrayMove(items, oldIndex, newIndex);
    await onReorder(moved.map((item) => item.id));
  };

  if (items.length === 0) {
    return (
      <p className="rounded border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        尚未选择任何文章。点击右上角「添加文章」开始挑选。
      </p>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <SortableFeaturedRow key={item.id} item={item} index={index} onRemove={onRemove} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableFeaturedRow({
  item,
  index,
  onRemove,
}: {
  item: HomeFeaturedItem;
  index: number;
  onRemove: HomeFeaturedDndProps['onRemove'];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch gap-2 rounded-md border bg-card ${isDragging ? 'opacity-70 shadow-md' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded-l-md border-r bg-muted/40 px-2 text-muted-foreground active:cursor-grabbing"
        aria-label="拖拽排序"
        title="拖拽排序"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1 py-2 pr-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <span className="truncate">{item.title}</span>
        </p>
        {item.excerpt ? <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.excerpt}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => void onRemove(item.id)}
        className="cursor-pointer rounded-r-md border-l px-3 text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-muted hover:text-foreground"
        aria-label="从首页移除"
        title="从首页移除"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}
