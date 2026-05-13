'use client';

import { Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RichTextEditor } from '@/components/admin/console/RichTextEditor';
import type { PostTypeAdminRow } from '@/components/admin/console/types';
import { useToast } from '@/components/Toast';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { stripLeadingTypeLikePrefixes } from '@/lib/strip-post-title-prefixes';

/**
 * 从 HTML 字符串里取第一个 h1 的纯文本（去掉嵌套标签）。
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

type ZenPostEditorProps =
  | {
      mode: 'create';
      open: boolean;
      onClose: () => void;
      onCreated?: () => void;
      availableTypes: PostTypeAdminRow[];
    }
  | {
      mode: 'edit';
      open: boolean;
      onClose: () => void;
      postId: number;
      initialTypeIds: number[];
      initialContent: string;
      initialContentEn: string;
      isHidden: boolean;
      excerpt: string;
      coverUrl: string;
      onSaved?: () => void;
      onDeleted?: () => void;
      availableTypes: PostTypeAdminRow[];
    };

const iconHeaderBtnClass =
  'inline-flex min-h-9 min-w-9 touch-manipulation items-center justify-center rounded border text-muted-foreground hover:bg-muted disabled:opacity-60';

function TypeMultiSelect({
  availableTypes,
  value,
  onChange,
  disabled,
}: {
  availableTypes: PostTypeAdminRow[];
  value: number[];
  onChange: (next: number[]) => void;
  disabled: boolean;
}) {
  const set = new Set(value);
  const toggle = (id: number) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(availableTypes.filter((t) => next.has(t.id)).map((t) => t.id));
  };

  return (
    <details className="relative max-w-xl rounded border border-dashed border-border bg-muted/20 px-3 py-2 text-sm">
      <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
        文章类型
        {value.length > 0 ? (
          <span className="ml-2 text-foreground">（已选 {value.length}）</span>
        ) : (
          <span className="ml-2">（可选）</span>
        )}
      </summary>
      <div className="mt-2 max-h-40 space-y-2 overflow-y-auto overscroll-y-contain pr-1">
        {availableTypes.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无类型，请先在「类型管理」中创建。</p>
        ) : (
          availableTypes.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-muted/60"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border border-input"
                checked={set.has(t.id)}
                disabled={disabled}
                onChange={() => toggle(t.id)}
              />
              <span>
                {t.nameZh}
                <span className="text-muted-foreground"> · {t.code}</span>
              </span>
            </label>
          ))
        )}
      </div>
    </details>
  );
}

/**
 * 全屏沉浸式编辑器：复用 RichTextEditor；顶栏为前台显示、删除（仅编辑）、保存、关闭。
 * 文章类型多选紧挨「中文正文 / English」标签下方（新建模式在正文编辑器上方）；
 * 保存时标题取自正文首个 H1 的纯文本并去掉开头的 `【…】`、`[…]` 装饰前缀（类型仅由多选提交，不从 H1 解析）。
 */
export function ZenPostEditor(props: ZenPostEditorProps) {
  const { showToast } = useToast();
  const visibilityFieldId = useId();
  const [content, setContent] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [draftIsHidden, setDraftIsHidden] = useState(false);
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const availableTypes = props.availableTypes;

  useLayoutEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const open = props.open;
  const mode = props.mode;
  const editPostId = props.mode === 'edit' ? props.postId : null;
  const editInitialContent = props.mode === 'edit' ? props.initialContent : '';
  const editInitialContentEn = props.mode === 'edit' ? props.initialContentEn : '';
  const editInitialTypeIds = props.mode === 'edit' ? props.initialTypeIds : [];
  const editSourceHidden = props.mode === 'edit' ? props.isHidden : false;

  useEffect(() => {
    if (!open) return;
    if (mode === 'create' || editPostId === null) {
      setContent('');
      setContentEn('');
      setSelectedTypeIds([]);
      return;
    }
    setContent(editInitialContent);
    setContentEn(editInitialContentEn);
    setSelectedTypeIds(editInitialTypeIds);
  }, [open, mode, editPostId, editInitialContent, editInitialContentEn, editInitialTypeIds]);

  useEffect(() => {
    if (!open || props.mode !== 'create') return;
    setDraftIsHidden(false);
    setSelectedTypeIds([]);
  }, [open, props.mode]);

  useEffect(() => {
    if (!open || editPostId === null) return;
    setDraftIsHidden(editSourceHidden);
  }, [open, editPostId, editSourceHidden]);

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
    const title = stripLeadingTypeLikePrefixes(extractFirstH1Text(content));
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
            typeIds: selectedTypeIds,
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
            typeIds: selectedTypeIds,
            isHidden: draftIsHidden,
            excerpt: props.excerpt,
            coverUrl: props.coverUrl,
            contentEn,
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
  }, [busy, content, contentEn, draftIsHidden, props, selectedTypeIds, showToast]);

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
  const editorMinHeightClassName = 'min-h-[calc(100svh_-_6rem_+_80vh)]';

  const overlay = (
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
        <div className="mx-auto max-w-3xl" style={{ paddingBottom: 'min(88vh, 56rem)' }}>
          {isEdit ? (
            <Tabs defaultValue="zh" className="w-full">
              <TabsList aria-label="正文语言">
                <TabsTrigger value="zh">中文正文</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
              </TabsList>
              <div className="mt-3">
                <TypeMultiSelect
                  availableTypes={availableTypes}
                  value={selectedTypeIds}
                  onChange={setSelectedTypeIds}
                  disabled={busy}
                />
              </div>
              <TabsContent value="zh" className="mt-3">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="编辑正文（首行 H1 作为标题）"
                  minHeightClassName={editorMinHeightClassName}
                />
              </TabsContent>
              <TabsContent value="en" className="mt-3">
                <RichTextEditor
                  value={contentEn}
                  onChange={setContentEn}
                  placeholder="英文正文（可选；保存时由正文内 H1 推导英文标题与摘要）"
                  minHeightClassName={editorMinHeightClassName}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <TypeMultiSelect
                availableTypes={availableTypes}
                value={selectedTypeIds}
                onChange={setSelectedTypeIds}
                disabled={busy}
              />
              <div className="mt-3">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="在正文最上方使用 H1 作为标题，例如「我的第一篇博文」"
                  minHeightClassName={editorMinHeightClassName}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, portalTarget);
}
