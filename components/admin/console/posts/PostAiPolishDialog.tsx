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

type AiPolishDiff = { unified: string; truncated: boolean };

type AiPolishApiPayload = {
  data?: PostItem & { isPinned?: boolean; updatedAt?: string | null };
  diff?: AiPolishDiff;
  error?: string;
};

type DialogStep = 'form' | 'running' | 'done';

type PostAiPolishDialogProps = {
  post: PostItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

async function parseAiPolishResponse(response: Response): Promise<{ data: PostItem; diff: AiPolishDiff }> {
  const payload = (await response.json()) as AiPolishApiPayload;
  if (!response.ok) {
    throw new Error(payload.error ?? '请求失败');
  }
  if (payload.data === undefined) {
    throw new Error('响应数据缺失');
  }
  if (!payload.diff || typeof payload.diff.unified !== 'string') {
    throw new Error('响应缺少 diff');
  }
  return { data: payload.data, diff: payload.diff };
}

export function PostAiPolishDialog({ post, open, onOpenChange }: PostAiPolishDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [polishCn, setPolishCn] = useState(true);
  const [translateAppendEn, setTranslateAppendEn] = useState(false);
  const [step, setStep] = useState<DialogStep>('form');
  const [diffText, setDiffText] = useState('');
  const [diffTruncated, setDiffTruncated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && post) {
      setStep('form');
      setPolishCn(true);
      setTranslateAppendEn(false);
      setDiffText('');
      setDiffTruncated(false);
    }
  }, [open, post]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (step === 'done') {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      }
      setStep('form');
      setDiffText('');
      setDiffTruncated(false);
      setLoading(false);
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!post || loading) return;
    if (!polishCn && !translateAppendEn) {
      showToast('请至少选择一项操作', 'error');
      return;
    }
    setLoading(true);
    setStep('running');
    try {
      const { diff } = await fetch(`/api/admin/posts/${post.id}/ai-polish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ polishCn, translateAppendEn }),
      }).then((res) => parseAiPolishResponse(res));
      setDiffText(diff.unified);
      setDiffTruncated(diff.truncated);
      setStep('done');
      showToast('已保存，请查看下方 diff', 'success');
    } catch (e) {
      setStep('form');
      showToast(e instanceof Error ? e.message : '处理失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = Boolean(post) && (polishCn || translateAppendEn) && !loading && step === 'form';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={step === 'done' ? 'max-h-[90vh] max-w-4xl overflow-hidden flex flex-col' : undefined}
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
          <DialogTitle>{step === 'done' ? '变更对比' : 'AI 润色'}</DialogTitle>
          <DialogDescription>
            {post ? `当前文章：${post.title}` : ''}
            {step === 'form'
              ? '可多选：仅中文润色会保留文末已有英文区块；勾选翻译会先去掉旧英文区再润色/翻译并重新追加。'
              : step === 'running'
                ? '正在调用模型并写入数据库…'
                : '以下为保存前后 HTML 的 unified diff（按行）。'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' ? (
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
        ) : null}

        {step === 'running' ? <p className="py-6 text-center text-sm text-muted-foreground">处理中，请稍候…</p> : null}

        {step === 'done' ? (
          <div className="min-h-0 flex-1 space-y-2">
            {diffTruncated ? (
              <p className="text-xs text-amber-600 dark:text-amber-500">Diff 已截断，完整内容已写入数据库。</p>
            ) : null}
            <pre className="scrollbar-subtle max-h-[50vh] overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap wrap-break-word">
              {diffText}
            </pre>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'done' ? (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              关闭
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                取消
              </Button>
              <Button type="button" onClick={() => void handleConfirm()} disabled={!canSubmit}>
                {loading ? '处理中…' : '开始'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
