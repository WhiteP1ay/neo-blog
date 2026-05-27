'use client';

import { useState } from 'react';
import { TypeMultiSelect } from '@/components/admin/TypeMultiSelect';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PostTypeAdminRow } from '../types';

type PostBulkTypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  availableTypes: PostTypeAdminRow[];
  onConfirm: (typeIds: number[]) => Promise<void>;
};

export function PostBulkTypeDialog({
  open,
  onOpenChange,
  selectedCount,
  availableTypes,
  onConfirm,
}: PostBulkTypeDialogProps) {
  const [typeIds, setTypeIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    if (next) setTypeIds([]);
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(typeIds);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量修改类型</DialogTitle>
          <DialogDescription>
            已选 {selectedCount} 篇文章。将<strong>完全覆盖</strong>所选文章的全部类型关联；不选任何类型则清空为未分类。
          </DialogDescription>
        </DialogHeader>
        <TypeMultiSelect availableTypes={availableTypes} value={typeIds} onChange={setTypeIds} disabled={submitting} />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={submitting}>
            {submitting ? '保存中…' : '确认'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
