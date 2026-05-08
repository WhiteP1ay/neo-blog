'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { RichTextEditor } from '../RichTextEditor';

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

  const previewHeader = props.mode === 'create' ? parseZenHeader(content) : null;

  const handleSave = useCallback(async () => {
    if (submitting) return;
    if (!content.trim()) {
      showToast('正文不能为空', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (props.mode === 'create') {
        const { title, type } = parseZenHeader(content);
        if (!title) {
          showToast('请在正文最上方放一个 H1 作为标题', 'error');
          return;
        }
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
            // 显式带回原值，避免 PUT 派生覆盖了禅模式想保持的字段。
            title: props.initialTitle,
            type: props.initialType,
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

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded border px-2 py-0.5 text-xs text-muted-foreground">禅模式</span>
          {props.mode === 'create' ? (
            <span className="text-xs text-muted-foreground">
              标题：{previewHeader?.title || <em className="opacity-60">请在正文里写一个 H1</em>}
              {previewHeader?.type ? `　·　type：${previewHeader.type}` : ''}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              编辑：{props.initialTitle}
              {props.initialType ? `　·　type：${props.initialType}` : ''}
            </span>
          )}
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
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder={props.mode === 'create' ? '从一个 H1 标题开始，比如：【tech】Hello World' : '编辑正文'}
            minHeightClassName="min-h-[70vh]"
          />
        </div>
      </div>
    </div>
  );
}
