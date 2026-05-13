'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/Toast';
import type { PostItem } from '../types';
import { AI_POLISH_APPLIED_MESSAGE_TYPE } from '@/lib/ai-polish-messages';
import { AI_POLISH_JOB_STORAGE_KEY, type AiPolishJobPayload } from '@/lib/ai-polish-job';

type PostAiPolishDialogProps = {
  post: PostItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** 勿含 noopener：带 noopener 时 window.open 会返回 null，导致无法 postMessage */
const PREVIEW_WINDOW_FEATURES = 'width=980,height=860';

export function PostAiPolishDialog({ post, open, onOpenChange }: PostAiPolishDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [polishCn, setPolishCn] = useState(true);
  const [translateAppendEn, setTranslateAppendEn] = useState(false);

  useEffect(() => {
    if (open && post) {
      setPolishCn(true);
      setTranslateAppendEn(false);
    }
  }, [open, post]);

  useEffect(() => {
    const onApplied = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === AI_POLISH_APPLIED_MESSAGE_TYPE) {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      }
    };
    window.addEventListener('message', onApplied);
    return () => window.removeEventListener('message', onApplied);
  }, [queryClient]);

  const handleStart = () => {
    if (!post) return;
    if (!polishCn && !translateAppendEn) {
      showToast('请至少选择一项操作', 'error');
      return;
    }

    const job: AiPolishJobPayload = {
      postId: post.id,
      polishCn,
      translateAppendEn,
      createdAt: Date.now(),
    };
    try {
      sessionStorage.setItem(AI_POLISH_JOB_STORAGE_KEY, JSON.stringify(job));
    } catch {
      showToast('无法写入预览任务，请检查浏览器是否禁用存储', 'error');
      return;
    }

    const previewUrl = `${window.location.origin}/admin/posts/${post.id}/ai-polish-preview`;
    const child = window.open(previewUrl, 'neoBlogAiPolishPreview', PREVIEW_WINDOW_FEATURES);
    if (!child) {
      showToast('无法打开预览窗口，请允许本站弹窗后重试', 'error');
      return;
    }

    showToast('已打开预览窗口，正在生成…', 'success');
  };

  const canStart = Boolean(post) && (polishCn || translateAppendEn);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI 润色</DialogTitle>
          <DialogDescription>
            {post ? `当前文章：${post.title}` : ''}
            点击开始后会在新窗口打开预览（行级 diff
            与变更前后渲染）；确认无误后在预览窗内点「应用」写入数据库。本弹窗需手动关闭。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <label className="flex cursor-pointer gap-3 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-muted/50">
            <input
              type="checkbox"
              className="mt-1"
              checked={polishCn}
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
              onChange={(e) => setTranslateAppendEn(e.target.checked)}
            />
            <span className="text-sm leading-snug">
              <span className="font-medium text-foreground">追加英文翻译</span>
              <span className="mt-1 block text-muted-foreground">
                文末附英文与锚点；再次执行会先移除旧英文区块再生成。
              </span>
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button type="button" onClick={handleStart} disabled={!canStart}>
            开始
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
