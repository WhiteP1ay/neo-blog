'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/admin/console/RichTextEditor';
import { UnifiedDiffView } from '@/components/admin/console/posts/UnifiedDiffView';
import { useToast } from '@/components/Toast';
import { AI_POLISH_APPLIED_MESSAGE_TYPE } from '@/lib/ai-polish-messages';
import type { AiPolishPreviewMessagePayload } from '@/lib/ai-polish-messages';
import { AI_POLISH_JOB_STORAGE_KEY, AI_POLISH_JOB_TTL_MS, type AiPolishJobPayload } from '@/lib/ai-polish-job';

type PreviewPayload = Omit<AiPolishPreviewMessagePayload, 'type'>;

type PreviewState =
  | { status: 'loading'; phaseLabel: string }
  | { status: 'ready'; payload: PreviewPayload }
  | { status: 'error'; message: string };

const PHASE_LABELS: Record<string, string> = {
  started: '已开始处理…',
  stripped: '已处理双语结构',
  polish_start: '中文润色中（调用模型）…',
  polish_done: '润色完成',
  translate_start: '翻译英文中…',
  translate_done: '翻译完成',
  assemble_start: '正在分离英文到独立字段…',
  assemble_done: '英文预览已就绪',
  diff_start: '正在生成行级对比…',
  diff_done: '对比已生成',
};

function phaseToLabel(step: string): string {
  return PHASE_LABELS[step] ?? step;
}

function parseSseBlockToEvents(block: string): unknown[] {
  const out: unknown[] = [];
  for (const line of block.split('\n')) {
    const t = line.trimEnd().replace(/^\uFEFF/, '');
    if (!t || !t.startsWith('data:')) continue;
    const payload = t.slice(5).replace(/^\s/, '').trim();
    if (!payload) continue;
    try {
      out.push(JSON.parse(payload));
    } catch {
      /* ignore malformed line */
    }
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function AiPolishPreviewClient({ postId }: { postId: number }) {
  const { showToast } = useToast();
  const [state, setState] = useState<PreviewState>({ status: 'loading', phaseLabel: '正在读取任务…' });
  const [draftAfterHtml, setDraftAfterHtml] = useState('');
  const [draftAfterHtmlEn, setDraftAfterHtmlEn] = useState('');
  const [paneHeightPx, setPaneHeightPx] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const dragRef = useRef<{ pointerId: number; startY: number; startH: number } | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const fail = (message: string) => {
      if (!cancelledRef.current) {
        setState({ status: 'error', message });
      }
    };

    const run = async () => {
      let raw: string | null = null;
      try {
        raw = sessionStorage.getItem(AI_POLISH_JOB_STORAGE_KEY);
      } catch {
        fail('无法读取预览任务，请检查浏览器存储权限');
        return;
      }

      if (!raw) {
        setState({ status: 'error', message: '请从博文管理重新发起' });
        return;
      }

      let job: AiPolishJobPayload;
      try {
        job = JSON.parse(raw) as AiPolishJobPayload;
      } catch {
        fail('预览任务数据无效，请关闭本页后重试');
        return;
      }

      if (
        typeof job.postId !== 'number' ||
        typeof job.polishCn !== 'boolean' ||
        typeof job.translateAppendEn !== 'boolean' ||
        typeof job.createdAt !== 'number'
      ) {
        fail('预览任务格式错误，请关闭本页后重试');
        return;
      }

      if (job.postId !== postId) {
        fail('任务与当前文章不匹配，请关闭本页后从博文管理重新发起');
        return;
      }

      if (!job.polishCn && !job.translateAppendEn) {
        fail('任务未选择任何操作，请重新发起');
        return;
      }

      if (Date.now() - job.createdAt > AI_POLISH_JOB_TTL_MS) {
        fail('预览任务已过期（超过 3 分钟），请关闭本页后重新发起');
        return;
      }

      try {
        sessionStorage.removeItem(AI_POLISH_JOB_STORAGE_KEY);
      } catch {
        /* 仍继续请求，避免重复应用同一任务 */
      }

      if (cancelledRef.current) return;
      setState({ status: 'loading', phaseLabel: '正在连接服务器…' });

      const res = await fetch(`/api/admin/posts/${postId}/ai-polish/preview`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          polishCn: job.polishCn,
          translateAppendEn: job.translateAppendEn,
          stream: true,
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        fail(json.error ?? `请求失败（${res.status}）`);
        return;
      }

      const body = res.body;
      if (!body) {
        fail('响应无内容');
        return;
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const resultSink: { payload: PreviewPayload | null } = { payload: null };

      const handleEvent = (ev: unknown) => {
        if (!isRecord(ev) || typeof ev.type !== 'string') return;
        if (ev.type === 'phase' && typeof ev.step === 'string') {
          if (!cancelledRef.current) {
            setState({ status: 'loading', phaseLabel: phaseToLabel(ev.step) });
          }
          return;
        }
        if (ev.type === 'error' && typeof ev.message === 'string') {
          throw new Error(ev.message);
        }
        if (ev.type === 'done' && isRecord(ev.data)) {
          const d = ev.data;
          const coverOk = !('coverUrl' in d) || d.coverUrl === null || typeof d.coverUrl === 'string';
          const afterEnOk = d.afterHtmlEn === null || typeof d.afterHtmlEn === 'string';
          const excerptEnOk = d.excerptEn === null || typeof d.excerptEn === 'string';
          const nextTitleEnOk = d.nextTitleEn === null || typeof d.nextTitleEn === 'string';
          if (
            typeof d.beforeHtml === 'string' &&
            typeof d.afterHtml === 'string' &&
            typeof d.nextTitle === 'string' &&
            typeof d.excerpt === 'string' &&
            coverOk &&
            afterEnOk &&
            excerptEnOk &&
            nextTitleEnOk &&
            isRecord(d.diff) &&
            typeof d.diff.unified === 'string' &&
            typeof d.diff.truncated === 'boolean'
          ) {
            resultSink.payload = {
              postId,
              beforeHtml: d.beforeHtml,
              afterHtml: d.afterHtml,
              afterHtmlEn: d.afterHtmlEn === null ? null : (d.afterHtmlEn as string),
              nextTitle: d.nextTitle,
              nextTitleEn: d.nextTitleEn === null ? null : (d.nextTitleEn as string),
              excerpt: d.excerpt,
              excerptEn: d.excerptEn === null ? null : (d.excerptEn as string),
              coverUrl: d.coverUrl === undefined ? null : (d.coverUrl as string | null),
              diff: {
                unified: d.diff.unified,
                truncated: d.diff.truncated,
              },
            };
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(0), { stream: !done });

        let splitIdx = buffer.indexOf('\n\n');
        while (splitIdx >= 0) {
          const block = buffer.slice(0, splitIdx);
          buffer = buffer.slice(splitIdx + 2);
          for (const parsed of parseSseBlockToEvents(block)) {
            handleEvent(parsed);
          }
          splitIdx = buffer.indexOf('\n\n');
        }

        if (done) break;
      }

      buffer += decoder.decode();
      if (buffer.trim()) {
        for (const parsed of parseSseBlockToEvents(buffer)) {
          handleEvent(parsed);
        }
      }

      if (cancelledRef.current) return;

      const finalPayload = resultSink.payload;
      if (!finalPayload) {
        fail('预览流未返回完整结果');
        return;
      }

      const vh = window.innerHeight;
      setPaneHeightPx(Math.round(clamp(vh * 0.58, 280, vh * 0.82)));
      setDraftAfterHtml(finalPayload.afterHtml);
      setDraftAfterHtmlEn(finalPayload.afterHtmlEn ?? '');
      setState({ status: 'ready', payload: finalPayload });
    };

    void run().catch((e: unknown) => {
      fail(e instanceof Error ? e.message : '预览失败');
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [postId]);

  const handleApply = useCallback(async () => {
    if (state.status !== 'ready' || applying) return;
    const content = draftAfterHtml.trim();
    if (!content) {
      showToast('变更后内容为空，无法保存', 'error');
      return;
    }
    if (state.payload.afterHtmlEn !== null && !draftAfterHtmlEn.trim()) {
      showToast('英文正文为空，无法保存', 'error');
      return;
    }
    const applyBody: Record<string, unknown> = { content };
    if (state.payload.afterHtmlEn !== null) {
      applyBody.contentEn = draftAfterHtmlEn;
    }
    setApplying(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/ai-polish/apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(applyBody),
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
  }, [applying, draftAfterHtml, draftAfterHtmlEn, postId, showToast, state.status]);

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

  if (state.status === 'loading') {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">正在生成预览</p>
        <p className="max-w-md text-xs leading-relaxed">{state.phaseLabel}</p>
        <p className="max-w-md text-xs text-muted-foreground/80">请勿关闭本页；生成完成后将自动展示对比与编辑区。</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return <div className="p-6 text-center text-sm text-destructive">{state.message}</div>;
  }

  const { beforeHtml, nextTitle, nextTitleEn, diff, afterHtmlEn } = state.payload;
  const paneH = paneHeightPx ?? Math.round(window.innerHeight * 0.58);
  const hasEnSplit = afterHtmlEn !== null;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden pb-24">
      <header className="shrink-0 space-y-1 border-b border-border px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
        <h1 className="text-base font-semibold leading-tight">AI 润色预览</h1>
        <p className="wrap-break-word text-sm text-muted-foreground">拟用中文标题：{nextTitle}</p>
        {hasEnSplit && nextTitleEn ? (
          <p className="wrap-break-word text-sm text-muted-foreground">拟用英文标题（来自英文 h1）：{nextTitleEn}</p>
        ) : null}
        {diff.truncated ? (
          <p className="text-xs text-amber-600 dark:text-amber-500">Diff 已截断，请以「变更后」编辑区为准。</p>
        ) : null}
      </header>

      <div
        className="mx-3 flex min-h-0 shrink-0 flex-col overflow-hidden sm:mx-4"
        style={{ height: paneH, minHeight: 200 }}
      >
        <Tabs defaultValue="diff" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="h-auto shrink-0 flex-wrap gap-1">
            <TabsTrigger value="diff">行级变更</TabsTrigger>
            <TabsTrigger value="before">变更前</TabsTrigger>
            {hasEnSplit ? (
              <>
                <TabsTrigger value="afterZh">变更后 · 中文</TabsTrigger>
                <TabsTrigger value="afterEn">变更后 · EN</TabsTrigger>
              </>
            ) : (
              <TabsTrigger value="after">变更后</TabsTrigger>
            )}
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
          <TabsContent
            value="afterZh"
            forceMount
            className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-background p-1">
              <RichTextEditor
                value={draftAfterHtml}
                onChange={setDraftAfterHtml}
                placeholder="在此编辑中文正文…"
                minHeightClassName="min-h-[40vh]"
              />
            </div>
          </TabsContent>
          <TabsContent
            value="afterEn"
            forceMount
            className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-background p-1">
              <RichTextEditor
                value={draftAfterHtmlEn}
                onChange={setDraftAfterHtmlEn}
                placeholder="English body HTML…"
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
