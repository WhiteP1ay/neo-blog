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
import {
  AI_POLISH_APPLIED_MESSAGE_TYPE,
  AI_POLISH_PREVIEW_MESSAGE_TYPE,
  type AiPolishPreviewMessagePayload,
} from '@/lib/ai-polish-messages';

type PreviewApiPayload = {
  data?: {
    postId: number;
    beforeHtml: string;
    afterHtml: string;
    nextTitle: string;
    excerpt: string;
    coverUrl: string | null;
    diff: { unified: string; truncated: boolean };
  };
  error?: string;
};

type PostAiPolishDialogProps = {
  post: PostItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PREVIEW_WINDOW_FEATURES = 'noopener,noreferrer,width=980,height=860';

export function PostAiPolishDialog({ post, open, onOpenChange }: PostAiPolishDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [polishCn, setPolishCn] = useState(true);
  const [translateAppendEn, setTranslateAppendEn] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleStart = async () => {
    if (!post || loading) return;
    if (!polishCn && !translateAppendEn) {
      showToast('请至少选择一项操作', 'error');
      return;
    }

    const previewUrl = `${window.location.origin}/admin/posts/${post.id}/ai-polish-preview`;
    const child = window.open(previewUrl, 'neoBlogAiPolishPreview', PREVIEW_WINDOW_FEATURES);
    if (!child) {
      showToast('无法打开预览窗口，请允许本站弹窗后重试', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}/ai-polish/preview`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ polishCn, translateAppendEn }),
      });
      const payload = (await res.json()) as PreviewApiPayload;
      if (!res.ok) {
        throw new Error(payload.error ?? '预览生成失败');
      }
      if (!payload.data) {
        throw new Error('响应数据缺失');
      }

      const msg: AiPolishPreviewMessagePayload = {
        type: AI_POLISH_PREVIEW_MESSAGE_TYPE,
        postId: payload.data.postId,
        beforeHtml: payload.data.beforeHtml,
        afterHtml: payload.data.afterHtml,
        nextTitle: payload.data.nextTitle,
        excerpt: payload.data.excerpt,
        coverUrl: payload.data.coverUrl,
        diff: payload.data.diff,
      };
      const sendPayload = () => {
        try {
          child.postMessage(msg, window.location.origin);
        } catch {
          showToast('无法推送预览到子窗口', 'error');
        }
      };
      child.addEventListener('load', sendPayload, { once: true });
      window.setTimeout(sendPayload, 1200);
      showToast('预览已发送到新窗口，请在预览窗内确认后点「应用」', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '预览失败', 'error');
      try {
        child.close();
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  };

  const canStart = Boolean(post) && (polishCn || translateAppendEn) && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!loading}
        onInteractOutside={(e) => {
          if (loading) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
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
              disabled={loading}
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
              disabled={loading}
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            关闭
          </Button>
          <Button type="button" onClick={() => void handleStart()} disabled={!canStart}>
            {loading ? '生成预览中…' : '开始'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
