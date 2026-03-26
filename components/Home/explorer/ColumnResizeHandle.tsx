'use client';

/**
 * 拖拽调整列宽的把手。
 */

import { cn } from '@/lib/utils';

export type ColumnResizeHandleProps = {
  label: string;
  onResizeStart: (clientX: number) => void;
};

export function ColumnResizeHandle({ label, onResizeStart }: ColumnResizeHandleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'group relative w-3 shrink-0 cursor-col-resize border-0 bg-transparent p-0',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        onResizeStart(e.clientX);
      }}
    >
      <span
        className={cn('bg-border group-hover:bg-primary/35 absolute inset-y-0 left-1/2 w-px -translate-x-1/2', 'group-active:bg-primary/50')}
        aria-hidden
      />
    </button>
  );
}

