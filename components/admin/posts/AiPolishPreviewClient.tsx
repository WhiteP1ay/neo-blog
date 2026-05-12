'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/admin/console/RichTextEditor';
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

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function AiPolishPreviewClient({ postId }: { postId: number }) {
  const { showToast } = useToast();
  const [state, setState] = useState<PreviewState>({ status: 'waiting' });
  const [draftAfterHtml, setDraftAfterHtml] = useState('');
  const [paneHeightPx, setPaneHeightPx] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const dragRef = useRef<{ pointerId: number; startY: number; startH: number } | null>(null);

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
      const vh = window.innerHeight;
      setPaneHeightPx(Math.round(clamp(vh * 0.58, 280, vh * 0.82)));
      setDraftAfterHtml(data.afterHtml);
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
    const content = draftAfterHtml.trim();
    if (!content) {
      showToast('变更后内容为空，无法保存', 'error');
      return;
    }
    setApplying(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/ai-polish/apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
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
  }, [applying, draftAfterHtml, postId, showToast, state.status]);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (paneHeightPx === null) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { pointerId: e.pointerId, startY: e.clientY, startH: paneHeightPx };
    },
    [paneHeightPx],
  );

  const onResizePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const vh = window.innerHeight;
    const delta = e.clientY - d.startY;
    const next = Math.round(d.startH + delta);
    const max = Math.round(vh - 100);
    setPaneHeightPx(clamp(next, 200, max));
  }, []);

  const onResizePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  if (state.status === 'waiting') {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <p>等待主窗口发送预览数据…</p>
        <p className="max-w-md text-xs">请在博文管理弹窗中点击「开始」；若本页已打开很久，请关闭后重试。</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return <div className="p-6 text-center text-sm text-destructive">{state.message}</div>;
  }

  const { beforeHtml, nextTitle, diff } = state.payload;
  const paneH = paneHeightPx ?? Math.round(window.innerHeight * 0.58);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden pb-24">
      <header className="shrink-0 space-y-1 border-b border-border px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
        <h1 className="text-base font-semibold leading-tight">AI 润色预览</h1>
        <p className="wrap-break-word text-sm text-muted-foreground">拟用标题：{nextTitle}</p>
        {diff.truncated ? (
          <p className="text-xs text-amber-600 dark:text-amber-500">Diff 已截断，请以「变更后」为准。</p>
        ) : null}
      </header>

      <div
        className="mx-3 flex min-h-0 shrink-0 flex-col overflow-hidden sm:mx-4"
        style={{ height: paneH, minHeight: 200 }}
      >
        <Tabs defaultValue="diff" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="shrink-0">
            <TabsTrigger value="diff">行级变更</TabsTrigger>
            <TabsTrigger value="before">变更前</TabsTrigger>
            <TabsTrigger value="after">变更后</TabsTrigger>
          </TabsList>
          <TabsContent
            value="diff"
            className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <UnifiedDiffView unified={diff.unified} className="min-h-0 flex-1 overflow-y-auto" />
          </TabsContent>
          <TabsContent
            value="before"
            className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <div
              className="scrollbar-subtle prose prose-sm dark:prose-invert min-h-0 flex-1 max-w-none overflow-y-auto rounded-md border border-border bg-card p-3"
              dangerouslySetInnerHTML={{ __html: beforeHtml }}
            />
          </TabsContent>
          <TabsContent
            value="after"
            forceMount
            className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-background p-1">
              <RichTextEditor
                value={draftAfterHtml}
                onChange={setDraftAfterHtml}
                placeholder="在此编辑变更后的正文…"
                minHeightClassName="min-h-[40vh]"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <button
        type="button"
        aria-label="拖拽调节预览区高度"
        className="mx-3 w-auto shrink-0 cursor-row-resize touch-none rounded border border-transparent py-2 hover:border-border sm:mx-4"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
      >
        <div className="mx-auto h-1 w-16 rounded-full bg-muted-foreground/30" />
      </button>

      <Button
        type="button"
        className="fixed bottom-4 right-4 z-50 shadow-md"
        onClick={() => void handleApply()}
        disabled={applying}
      >
        {applying ? '写入中…' : '应用'}
      </Button>
    </div>
  );
}
