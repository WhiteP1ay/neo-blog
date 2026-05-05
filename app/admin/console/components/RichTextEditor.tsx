'use client';

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import { common, createLowlight } from 'lowlight';
import type { ReactNode } from 'react';
import { useCallback, useEffect } from 'react';
import { useToast } from '@/components/Toast';

const lowlight = createLowlight(common);

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  toolbarRight?: ReactNode;
};

/**
 * 轻量富文本编辑器，供 admin 博文编辑复用。
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容',
  minHeightClassName = 'min-h-48',
  toolbarRight,
}: RichTextEditorProps) {
  const { showToast } = useToast();

  /**
   * 上传图片到 OSS（不入库），返回可访问 URL。
   */
  const uploadImageToOss = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/uploads/image', {
        method: 'POST',
        body: formData,
      });
      const payload = (await response.json()) as { data?: { url?: string }; error?: string };
      if (!response.ok || !payload.data?.url) {
        throw new Error(payload.error ?? '图片上传失败');
      }
      return payload.data.url;
    },
    [],
  );

  /**
   * 粘贴/拖拽图片后异步上传并插入 markdown 文本。
   */
  const handleImageInput = useCallback(
    async (file: File, insertAt: (markdownText: string) => void) => {
      showToast(`开始上传图片：${file.name}`, 'info');
      try {
        const url = await uploadImageToOss(file);
        const alt = file.name.replace(/\.[^.]+$/i, '').trim() || 'image';
        const markdownText = `![${alt}](${url})`;
        insertAt(markdownText);
        await navigator.clipboard.writeText(markdownText);
        showToast('图片已上传，Markdown 链接已复制到剪贴板', 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : '图片上传失败', 'error');
      }
    },
    [showToast, uploadImageToOss],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none rounded border bg-background p-3 text-foreground focus:outline-none ${minHeightClassName}`,
      },
      handleKeyDown: (view, event) => {
        if (event.key !== 'Enter') return false;
        const { state } = view;
        const { selection } = state;
        if (!selection.empty) return false;
        const lineStart = selection.$from.start();
        const currentLineText = state.doc.textBetween(lineStart, selection.from, '\n', '\n').trim();
        const fencedCodeMatch = currentLineText.match(/^```([\w-]+)?$/);
        if (!fencedCodeMatch) return false;
        const fenceLang = fencedCodeMatch[1]?.trim().toLowerCase() || null;
        event.preventDefault();
        const tr = state.tr.delete(lineStart, selection.from);
        view.dispatch(tr);
        const nextState = view.state;
        const codeBlockType = nextState.schema.nodes.codeBlock;
        if (!codeBlockType) return false;
        const node = codeBlockType.create({ language: fenceLang });
        const nextTr = nextState.tr.replaceSelectionWith(node).scrollIntoView();
        view.dispatch(nextTr);
        return true;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
        if (!imageItem) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        event.preventDefault();
        void handleImageInput(file, (markdownText) => {
          const { state, dispatch } = view;
          dispatch(state.tr.insertText(markdownText, state.selection.from, state.selection.to));
        });
        return true;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFile = Array.from(files).find((file) => file.type.startsWith('image/'));
        if (!imageFile) return false;
        event.preventDefault();
        void handleImageInput(imageFile, (markdownText) => {
          const { state, dispatch } = view;
          dispatch(state.tr.insertText(markdownText, state.selection.from, state.selection.to));
        });
        return true;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (currentHtml !== value) {
      // 外部值变化时同步回编辑器，但避免触发二次 onUpdate。
      editor.commands.setContent(value || '<p></p>', false);
    }
  }, [editor, value]);

  if (!editor) {
    return <div className={`rounded border p-3 text-sm text-muted-foreground ${minHeightClassName}`}>{placeholder}</div>;
  }

  return (
    <div className="relative space-y-2">
      <div className="sticky top-0 z-30 flex flex-wrap gap-2 rounded border bg-background p-2 shadow-sm">
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().toggleBold().run()}>
          粗体
        </button>
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().toggleItalic().run()}>
          斜体
        </button>
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          无序列表
        </button>
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          有序列表
        </button>
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          引用
        </button>
        <button
          className="rounded border px-2 py-1 text-xs"
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          插入表格
        </button>
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().addRowAfter().run()}>
          +行
        </button>
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}>
          +列
        </button>
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().deleteRow().run()}>
          -行
        </button>
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().deleteColumn().run()}>
          -列
        </button>
        <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => editor.chain().focus().deleteTable().run()}>
          删表
        </button>
        {toolbarRight ? <div className="ml-auto flex items-center gap-2">{toolbarRight}</div> : null}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
