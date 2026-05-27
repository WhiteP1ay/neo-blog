'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PostItem } from '../types';

type PostBulkDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPosts: PostItem[];
  onConfirm: () => Promise<void>;
};

export function PostBulkDeleteDialog({ open, onOpenChange, selectedPosts, onConfirm }: PostBulkDeleteDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const preview = selectedPosts.slice(0, 5);
  const rest = selectedPosts.length - preview.length;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量删除</DialogTitle>
          <DialogDescription>
            确定删除所选 {selectedPosts.length} 篇文章吗？相关评论也会被删除，且不可恢复。
          </DialogDescription>
        </DialogHeader>
        {preview.length > 0 ? (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-muted-foreground">
            {preview.map((p) => (
              <li key={p.id} className="truncate">
                ID {p.id} · {p.title}
              </li>
            ))}
            {rest > 0 ? <li>…等 {selectedPosts.length} 篇</li> : null}
          </ul>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button type="button" variant="destructive" onClick={() => void handleConfirm()} disabled={submitting}>
            {submitting ? '删除中…' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
