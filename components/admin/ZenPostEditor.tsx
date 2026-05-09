'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/components/Toast';
import { RichTextEditor } from '@/app/admin/console/components/RichTextEditor';

/**
 * 从 HTML 字符串里取第一个 h1 的纯文本（去掉嵌套标签）。
 * 用 DOMParser 在浏览器侧解析，避免引入 cheerio 等额外依赖。
 */
function extractFirstH1Text(html: string): string {
  if (typeof window === 'undefined' || !html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const h1 = doc.querySelector('h1');
    return h1?.textContent?.trim() ?? '';
  } catch {
    return '';
  }
}

/**
 * 解析 h1 文本里的 【type】 前缀；保留原 h1 文本作为 title。
 */
function parseZenHeader(html: string): { title: string; type: string } {
  const h1Text = extractFirstH1Text(html);
  if (!h1Text) return { title: '', type: '' };
  const match = h1Text.match(/^【([^】]+)】/);
  return {
    title: h1Text,
    type: match?.[1].trim() ?? '',
  };
}

type ZenPostEditorProps =
  | {
      mode: 'create';
      open: boolean;
      onClose: () => void;
      onCreated?: () => void;
    }
  | {
      mode: 'edit';
      open: boolean;
      onClose: () => void;
      postId: number;
      initialTitle: string;
      initialType: string;
      initialContent: string;
      isHidden: boolean;
      excerpt: string;
      coverUrl: string;
      onSaved?: () => void;
    };

/**
 * 全屏沉浸式编辑器：复用 RichTextEditor，只暴露最小工具条（保存 / 关闭）。
 * - create：从正文 h1 派生 title，从 【...】 派生 type，封面/摘要默认为空，文章默认可见。
 * - edit：原样保存正文 HTML，title/type/cover/excerpt/可见性沿用原值，保持简单可控。
 */
export function ZenPostEditor(props: ZenPostEditorProps) {
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const open = props.open;
  const mode = props.mode;
  const editPostId = props.mode === 'edit' ? props.postId : null;
  const editInitialContent = props.mode === 'edit' ? props.initialContent : '';

  useEffect(() => {
    if (!open) return;
    // 切换 mode / open / 编辑目标 时重置内部正文，进入禅模式时保证一个干净起点。
    if (mode === 'create' || editPostId === null) {
      setContent('');
      return;
    }
    setContent(editInitialContent);
  }, [open, mode, editPostId, editInitialContent]);

  /** 打开禅模式时禁止背后文档滚动；待 Portal 挂到 body 后再锁，避免遮罩尚未出现时误锁一页。 */
  useEffect(() => {
    if (!props.open || !portalTarget) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    const gutter = window.innerWidth - html.clientWidth;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (gutter > 0) {
      body.style.paddingRight = `${gutter}px`;
    }
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [props.open, portalTarget]);

  const handleSave = useCallback(async () => {
    if (submitting) return;
    if (!content.trim()) {
      showToast('正文不能为空', 'error');
      return;
    }
    // 创建与编辑都从正文 h1 派生 title 与 type；缺 h1 直接拒绝保存，行为一致。
    const { title, type } = parseZenHeader(content);
    if (!title) {
      showToast('请在正文最上方放一个 H1 作为标题', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (props.mode === 'create') {
        const response = await fetch('/api/admin/posts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            type,
            isHidden: false,
            excerpt: '',
            coverUrl: '',
            mode: 'zen',
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? '创建失败');
        }
        showToast('已创建', 'success');
        props.onCreated?.();
        props.onClose();
      } else {
        const response = await fetch(`/api/admin/posts/${props.postId}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            content,
            // 用从 h1 派生的最新 title/type 覆盖原值；isHidden/excerpt/coverUrl 保持禅模式简洁原则不动。
            title,
            type,
            isHidden: props.isHidden,
            excerpt: props.excerpt,
            coverUrl: props.coverUrl,
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? '保存失败');
        }
        showToast('已保存', 'success');
        props.onSaved?.();
        props.onClose();
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '操作失败', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [content, props, showToast, submitting]);

  if (!props.open || !portalTarget) return null;

  const overlay = (
    // overflow-hidden + 下方滚动区 min-h-0：flex 子项才能低于内容高度，只保留一层纵向滚动；Portal 到 body 避免祖先 transform 影响 fixed。
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded border px-2 py-0.5 text-xs text-muted-foreground">禅模式</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={submitting}
            className="rounded border border-primary bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-60"
          >
            {submitting ? '保存中…' : '保存'}
          </button>
          <button
            type="button"
            onClick={props.onClose}
            disabled={submitting}
            className="inline-flex h-7 w-7 items-center justify-center rounded border text-muted-foreground hover:bg-muted disabled:opacity-60"
            aria-label="关闭"
            title="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-4">
        {/* paddingBottom 用 inline，避免 Tailwind 任意类里嵌套 min(..., ...) 解析出问题；高度逻辑与原先 pb-[min(88vh,56rem)] 一致 */}
        <div className="mx-auto max-w-3xl" style={{ paddingBottom: 'min(88vh, 56rem)' }}>
          {/* min-h 不含 min(a,b)，避免 Tailwind 任意值解析异常；高度≈可视区减顶栏后再加 80vh */}
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder={props.mode === 'create' ? '从一个 H1 标题开始，比如：【tech】Hello World' : '编辑正文'}
            minHeightClassName="min-h-[calc(100svh_-_6rem_+_80vh)]"
          />
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, portalTarget);
}
