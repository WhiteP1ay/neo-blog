'use client';

import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

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
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
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
    <div className="space-y-2">
      <div className="sticky top-0 z-10 flex flex-wrap gap-2 rounded border bg-background/95 p-2 backdrop-blur">
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
