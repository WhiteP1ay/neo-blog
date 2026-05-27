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
import { MAX_BULK_AI_POLISH_POSTS } from '@/lib/admin-bulk-post-constants';

type PostBulkAiPolishDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (options: { polishCn: boolean; translateAppendEn: boolean }) => Promise<void>;
};

export function PostBulkAiPolishDialog({ open, onOpenChange, selectedCount, onConfirm }: PostBulkAiPolishDialogProps) {
  const [polishCn, setPolishCn] = useState(true);
  const [translateAppendEn, setTranslateAppendEn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    if (next) {
      setPolishCn(true);
      setTranslateAppendEn(false);
    }
    onOpenChange(next);
  };

  const canStart = polishCn || translateAppendEn;
  const overLimit = selectedCount > MAX_BULK_AI_POLISH_POSTS;

  const handleStart = async () => {
    if (!canStart || overLimit) return;
    setSubmitting(true);
    try {
      await onConfirm({ polishCn, translateAppendEn });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量 AI 润色</DialogTitle>
          <DialogDescription>
            已选 {selectedCount} 篇文章。将<strong>直接写入数据库</strong>，不提供 diff 预览，请谨慎使用。
            {overLimit ? (
              <span className="mt-2 block text-destructive">
                单次最多 {MAX_BULK_AI_POLISH_POSTS} 篇，请缩小选择范围。
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <label className="flex cursor-pointer gap-3 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-muted/50">
            <input
              type="checkbox"
              className="mt-1"
              checked={polishCn}
              disabled={submitting}
              onChange={(e) => setPolishCn(e.target.checked)}
            />
            <span className="text-sm leading-snug">
              <span className="font-medium text-foreground">中文润色</span>
              <span className="mt-1 block text-muted-foreground">结构、排版、错别字；中英混排空格与英文大小写。</span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-muted/50">
            <input
              type="checkbox"
              className="mt-1"
              checked={translateAppendEn}
              disabled={submitting}
              onChange={(e) => setTranslateAppendEn(e.target.checked)}
            />
            <span className="text-sm leading-snug">
              <span className="font-medium text-foreground">翻译为英文（独立字段）</span>
              <span className="mt-1 block text-muted-foreground">写入 contentEn / titleEn，不再拼在中文正文底部。</span>
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            关闭
          </Button>
          <Button type="button" onClick={() => void handleStart()} disabled={!canStart || submitting || overLimit}>
            {submitting ? '处理中…' : '开始'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
