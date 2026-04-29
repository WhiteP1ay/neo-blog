'use client';

/**
 * 右侧富文本编辑：TipTap StarterKit + 标题，保存写入 posts.content（HTML）。
 */

import { useCallback, useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Link from '@tiptap/extension-link';
import { Bold, Heading2, Italic, List, ListOrdered } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePost } from '@/server/actions/posts';
import { cn } from '@/lib/utils';

/** 与首页 RSC 序列化后的文章详情字段一致 */
export interface PostRichEditorPostPayload {
  id: number;
  title: string;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PostRichEditorProps {
  post: PostRichEditorPostPayload;
  onSaved: () => void;
  onCancel: () => void;
}

export function PostRichEditor({ post, onSaved, onCancel }: PostRichEditorProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(post.title);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
      }),
    ],
    content: post.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-neutral dark:prose-invert max-w-none min-h-[min(50vh,420px)] px-1 py-3 focus:outline-none text-sm sm:text-base',
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    setTitle(post.title);
    editor.commands.setContent(post.content, false);
  }, [editor, post.title, post.content]);

  const handleSave = useCallback(async () => {
    if (!editor) {
      return;
    }
    const t = title.trim() || '无标题';
    const html = editor.getHTML();
    setSaving(true);
    const result = await updatePost(post.id, { title: t, content: html });
    setSaving(false);
    if (!result.success) {
      showToast(result.error ?? '保存失败', 'error');
      return;
    }
    showToast('已保存', 'success');
    onSaved();
  }, [editor, title, post.id, onSaved, showToast]);

  if (!editor) {
    return <div className="text-muted-foreground p-6 text-sm">编辑器加载中…</div>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <div className="bg-background/95 sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border pb-3 backdrop-blur supports-backdrop-filter:bg-background/80">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="icon"
          className="size-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="粗体"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="icon"
          className="size-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="斜体"
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          size="icon"
          className="size-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="二级标题"
        >
          <Heading2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="icon"
          className="size-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="无序列表"
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="icon"
          className="size-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="有序列表"
        >
          <ListOrdered className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('table') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          表格
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.isActive('table')}
        >
          加行
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.isActive('table')}
        >
          删行
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.isActive('table')}
        >
          加列
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.isActive('table')}
        >
          删表
        </Button>
        <span className="min-w-4 flex-1" />
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          取消
        </Button>
        <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`home-editor-title-${post.id}`}>标题</Label>
        <Input
          id={`home-editor-title-${post.id}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="文章标题"
          className="text-base font-semibold"
        />
      </div>

      <div className={cn('border-input bg-background rounded-lg border shadow-sm', 'focus-within:ring-ring focus-within:ring-1')}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

