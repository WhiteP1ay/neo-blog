'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Post } from '@/server/actions/posts';

interface SortablePostItemProps {
  post: Post;
  onRemove: (postId: number) => void;
}

function SortablePostItem({ post, onRemove }: SortablePostItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100"
      {...attributes}
      {...listeners}
    >
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
      </svg>
      <span className="text-sm text-gray-700 flex-1">{post.title}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(post.id);
        }}
        className="text-red-600 hover:text-red-800 text-xs"
      >
        移除
      </button>
    </div>
  );
}

interface SortablePostListProps {
  posts: Array<{ postId: number; sortOrder: number }>;
  allPosts: Post[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (postId: number) => void;
}

export function SortablePostList({ posts, allPosts, onReorder, onRemove }: SortablePostListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortedPosts = [...posts].sort((a, b) => a.sortOrder - b.sortOrder);
  const postItems = sortedPosts
    .map((sp) => allPosts.find((p) => p.id === sp.postId))
    .filter((p): p is Post => p !== undefined);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = postItems.findIndex((p) => p.id === active.id);
      const newIndex = postItems.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  if (postItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-700 mb-2">已选文章（可拖拽排序）</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={postItems.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {postItems.map((post) => (
              <SortablePostItem key={post.id} post={post} onRemove={onRemove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
