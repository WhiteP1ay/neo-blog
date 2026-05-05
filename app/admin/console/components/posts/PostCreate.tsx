'use client';

import { RichTextEditor } from '../RichTextEditor';

type PostCreateProps = {
  open: boolean;
  onClose: () => void;
  form: {
    newPostTitle: string;
    setNewPostTitle: (value: string) => void;
    newPostContent: string;
    setNewPostContent: (value: string) => void;
    newPostType: string;
    setNewPostType: (value: string) => void;
    newPostIsHidden: boolean;
    setNewPostIsHidden: (value: boolean) => void;
    postUploadHint: string;
    createPost: () => Promise<void>;
    uploadPostFile: (file: File) => Promise<void>;
  };
};

export function PostCreate({ open, onClose, form }: PostCreateProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <button className="absolute inset-0 bg-black/70" type="button" aria-label="关闭新增博文弹窗" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-5xl space-y-3 overflow-y-auto rounded border bg-background p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">新增博文</h3>
          <button className="rounded border px-2 py-1 text-xs" type="button" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="space-y-2">
          <input className="w-full rounded border px-2 py-1" placeholder="标题" value={form.newPostTitle} onChange={(e) => form.setNewPostTitle(e.target.value)} />
          <input className="w-full rounded border px-2 py-1" placeholder="类型（默认空）" value={form.newPostType} onChange={(e) => form.setNewPostType(e.target.value)} />
          <RichTextEditor value={form.newPostContent} onChange={form.setNewPostContent} placeholder="正文（HTML）" minHeightClassName="min-h-32" />
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={form.newPostIsHidden} onChange={(e) => form.setNewPostIsHidden(e.target.checked)} />
            隐藏
          </label>
          <button
            className="rounded border px-3 py-1"
            type="button"
            onClick={async () => {
              await form.createPost();
              onClose();
            }}
          >
            创建
          </button>
          <label
            className="block rounded border border-dashed p-3 text-sm text-muted-foreground"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) void form.uploadPostFile(file);
            }}
          >
            拖拽 Markdown 文件到这里上传
            <input
              type="file"
              accept=".md,text/markdown"
              className="mt-2 block"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void form.uploadPostFile(file);
              }}
            />
          </label>
          {form.postUploadHint ? <p className="text-xs text-muted-foreground">{form.postUploadHint}</p> : null}
        </div>
      </div>
    </div>
  );
}
