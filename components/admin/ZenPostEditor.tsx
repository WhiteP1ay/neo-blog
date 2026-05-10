'use client';

import { Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RichTextEditor } from '@/components/admin/console/RichTextEditor';
import { useToast } from '@/components/Toast';
import { Switch } from '@/components/ui/switch';

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
      /** 删除成功后回调（例如 invalidate、重置父级编辑状态） */
      onDeleted?: () => void;
    };

const iconHeaderBtnClass =
  'inline-flex min-h-9 min-w-9 touch-manipulation items-center justify-center rounded border text-muted-foreground hover:bg-muted disabled:opacity-60';

/**
 * 全屏沉浸式编辑器：复用 RichTextEditor；顶栏右侧为前台显示 Switch、删除（仅编辑）、保存、关闭。
 * - create：可设默认隐藏；保存时写入 isHidden。
 * - edit：保存时写入正文派生的 title/type、draftIsHidden、原 excerpt/coverUrl。
 */
export function ZenPostEditor(props: ZenPostEditorProps) {
  const { showToast } = useToast();
  const visibilityFieldId = useId();
  const [content, setContent] = useState('');
  const [draftIsHidden, setDraftIsHidden] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const open = props.open;
  const mode = props.mode;
  const editPostId = props.mode === 'edit' ? props.postId : null;
  const editInitialContent = props.mode === 'edit' ? props.initialContent : '';
  const editSourceHidden = props.mode === 'edit' ? props.isHidden : false;

  useEffect(() => {
    if (!open) return;
    // 切换 mode / open / 编辑目标 时重置内部正文，打开全屏编辑器时保证干净起点。
    if (mode === 'create' || editPostId === null) {
      setContent('');
      return;
    }
    setContent(editInitialContent);
  }, [open, mode, editPostId, editInitialContent]);

  /** 新建打开时默认前台显示 */
  useEffect(() => {
    if (!open || props.mode !== 'create') return;
    setDraftIsHidden(false);
  }, [open, props.mode]);

  /** 编辑打开或切换文章时，同步可见性草稿 */
  useEffect(() => {
    if (!open || editPostId === null) return;
    setDraftIsHidden(editSourceHidden);
  }, [open, editPostId, editSourceHidden]);

  /** 全屏编辑器打开时禁止背后文档滚动；待 Portal 挂到 body 后再锁，避免遮罩尚未出现时误锁一页。 */
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

  const busy = submitting || deleting;

  const handleSave = useCallback(async () => {
    if (busy) return;
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
            isHidden: draftIsHidden,
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
            title,
            type,
            isHidden: draftIsHidden,
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
  }, [busy, content, draftIsHidden, props, showToast]);

  const handleDelete = useCallback(async () => {
    if (props.mode !== 'edit' || busy) return;
    if (!window.confirm('确定删除这篇文章吗？相关评论也会被删除，且不可恢复。')) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/posts/${props.postId}`, { method: 'DELETE' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? '删除失败');
      }
      showToast('已删除', 'success');
      props.onDeleted?.();
      props.onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除失败', 'error');
    } finally {
      setDeleting(false);
    }
  }, [busy, props, showToast]);

  if (!props.open || !portalTarget) return null;

  const isEdit = props.mode === 'edit';

  const overlay = (
    // overflow-hidden + 下方滚动区 min-h-0：flex 子项才能低于内容高度，只保留一层纵向滚动；Portal 到 body 避免祖先 transform 影响 fixed。
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-b px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id={visibilityFieldId}
              checked={!draftIsHidden}
              disabled={busy}
              onCheckedChange={(checked) => setDraftIsHidden(!checked)}
              aria-label="前台显示"
            />
            <label htmlFor={visibilityFieldId} className="cursor-pointer select-none text-xs text-muted-foreground">
              前台显示
            </label>
          </div>
          {isEdit ? (
            <button
              type="button"
              className={iconHeaderBtnClass}
              disabled={busy}
              onClick={() => void handleDelete()}
              aria-label="删除文章"
              title="删除文章"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={busy}
            className="rounded border border-primary bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-60"
          >
            {submitting ? '保存中…' : '保存'}
          </button>
          <button
            type="button"
            onClick={props.onClose}
            disabled={busy}
            className="inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded border text-muted-foreground hover:bg-muted disabled:opacity-60 sm:h-7 sm:w-7"
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
