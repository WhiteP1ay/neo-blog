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

type AiPolishMode = 'polish_cn' | 'translate_append_en';

type JsonPayload<T> = {
  data?: T;
  error?: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as JsonPayload<T>;
  if (!response.ok) {
    throw new Error(payload.error ?? '请求失败');
  }
  if (payload.data === undefined) {
    throw new Error('响应数据缺失');
  }
  return payload.data;
}

type PostAiPolishDialogProps = {
  post: PostItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PostAiPolishDialog({ post, open, onOpenChange }: PostAiPolishDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [mode, setMode] = useState<AiPolishMode>('polish_cn');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && post) setMode('polish_cn');
  }, [open, post]);

  const handleConfirm = async () => {
    if (!post || loading) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/posts/${post.id}/ai-polish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode }),
      }).then((res) => parseJsonResponse(res));
      showToast('AI 处理完成，可点「编辑」查看最新正文', 'success');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      onOpenChange(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : '处理失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI 润色</DialogTitle>
          <DialogDescription>
            {post ? `当前文章：${post.title}` : ''}选择处理方式后将直接保存；英文模式会替换已有英文区块。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <label className="flex cursor-pointer gap-3 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-muted/50">
            <input
              type="radio"
              name="ai-polish-mode"
              className="mt-1"
              checked={mode === 'polish_cn'}
              onChange={() => setMode('polish_cn')}
              disabled={loading}
            />
            <span className="text-sm leading-snug">
              <span className="font-medium text-foreground">中文润色</span>
              <span className="mt-1 block text-muted-foreground">结构、排版、错别字；中英混排空格与英文大小写。</span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-muted/50">
            <input
              type="radio"
              name="ai-polish-mode"
              className="mt-1"
              checked={mode === 'translate_append_en'}
              onChange={() => setMode('translate_append_en')}
              disabled={loading}
            />
            <span className="text-sm leading-snug">
              <span className="font-medium text-foreground">追加英文翻译</span>
              <span className="mt-1 block text-muted-foreground">
                保留中文正文，文末附英文；标题下增加跳转锚点（再次执行会替换旧英文）。
              </span>
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={loading || !post}>
            {loading ? '处理中…' : '开始'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
