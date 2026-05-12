'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedDiffView } from '@/components/admin/console/posts/UnifiedDiffView';
import { useToast } from '@/components/Toast';
import {
  AI_POLISH_APPLIED_MESSAGE_TYPE,
  AI_POLISH_PREVIEW_MESSAGE_TYPE,
  type AiPolishPreviewMessagePayload,
} from '@/lib/ai-polish-messages';

type PreviewState =
  | { status: 'waiting' }
  | { status: 'ready'; payload: AiPolishPreviewMessagePayload }
  | { status: 'error'; message: string };

export function AiPolishPreviewClient({ postId }: { postId: number }) {
  const { showToast } = useToast();
  const [state, setState] = useState<PreviewState>({ status: 'waiting' });
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as Partial<AiPolishPreviewMessagePayload> | null;
      if (!data || data.type !== AI_POLISH_PREVIEW_MESSAGE_TYPE) return;
      if (data.postId !== postId) return;
      if (
        typeof data.beforeHtml !== 'string' ||
        typeof data.afterHtml !== 'string' ||
        typeof data.nextTitle !== 'string' ||
        !data.diff ||
        typeof data.diff.unified !== 'string'
      ) {
        setState({ status: 'error', message: '预览数据不完整' });
        return;
      }
      setState({
        status: 'ready',
        payload: data as AiPolishPreviewMessagePayload,
      });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [postId]);

  const handleApply = useCallback(async () => {
    if (state.status !== 'ready' || applying) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/ai-polish/apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: state.payload.afterHtml }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? '保存失败');
      }
      showToast('已应用并写入数据库', 'success');
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: AI_POLISH_APPLIED_MESSAGE_TYPE, postId }, window.location.origin);
        }
      } catch {
        /* opener 跨域或已关 */
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存失败', 'error');
    } finally {
      setApplying(false);
    }
  }, [applying, postId, showToast, state]);

  if (state.status === 'waiting') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <p>等待主窗口发送预览数据…</p>
        <p className="max-w-md text-xs">请在博文管理弹窗中点击「开始」；若本页已打开很久，请关闭后重试。</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return <div className="p-6 text-center text-sm text-destructive">{state.message}</div>;
  }

  const { beforeHtml, afterHtml, nextTitle, diff } = state.payload;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
      <header className="shrink-0 space-y-1 border-b border-border pb-3">
        <h1 className="text-base font-semibold leading-tight">AI 润色预览</h1>
        <p className="wrap-break-word text-sm text-muted-foreground">拟用标题：{nextTitle}</p>
        {diff.truncated ? (
          <p className="text-xs text-amber-600 dark:text-amber-500">Diff 已截断，请以「变更后」为准。</p>
        ) : null}
      </header>

      <Tabs defaultValue="diff" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0">
          <TabsTrigger value="diff">行级变更</TabsTrigger>
          <TabsTrigger value="before">变更前</TabsTrigger>
          <TabsTrigger value="after">变更后</TabsTrigger>
        </TabsList>
        <TabsContent value="diff" className="min-h-0 flex-1 overflow-hidden">
          <UnifiedDiffView unified={diff.unified} className="max-h-[min(55vh,28rem)] overflow-y-auto" />
        </TabsContent>
        <TabsContent value="before" className="min-h-0 flex-1 overflow-hidden">
          <div
            className="scrollbar-subtle prose prose-sm dark:prose-invert max-h-[min(55vh,28rem)] max-w-none overflow-y-auto rounded-md border border-border bg-card p-3"
            dangerouslySetInnerHTML={{ __html: beforeHtml }}
          />
        </TabsContent>
        <TabsContent value="after" className="min-h-0 flex-1 overflow-hidden">
          <div
            className="scrollbar-subtle prose prose-sm dark:prose-invert max-h-[min(55vh,28rem)] max-w-none overflow-y-auto rounded-md border border-border bg-card p-3"
            dangerouslySetInnerHTML={{ __html: afterHtml }}
          />
        </TabsContent>
      </Tabs>

      <footer className="mt-auto flex shrink-0 flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button type="button" onClick={() => void handleApply()} disabled={applying}>
          {applying ? '写入中…' : '应用（写入数据库）'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/admin/posts/${postId}/edit`} target="_blank" rel="noopener noreferrer">
            编辑（新标签）
          </Link>
        </Button>
      </footer>
    </div>
  );
}
