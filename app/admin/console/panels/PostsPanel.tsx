'use client';

import type { PostItem } from '../types';
import { RichTextEditor } from '../components/RichTextEditor';

type PostFormState = {
  newPostTitle: string;
  setNewPostTitle: (value: string) => void;
  newPostContent: string;
  setNewPostContent: (value: string) => void;
  newPostType: string;
  setNewPostType: (value: string) => void;
  newPostIsHidden: boolean;
  setNewPostIsHidden: (value: boolean) => void;
  postUploadHint: string;
  editingPostId: number | null;
  editPostTitle: string;
  setEditPostTitle: (value: string) => void;
  editPostContent: string;
  setEditPostContent: (value: string) => void;
  editPostType: string;
  setEditPostType: (value: string) => void;
  editPostIsHidden: boolean;
  setEditPostIsHidden: (value: boolean) => void;
  editPostExcerpt: string;
  setEditPostExcerpt: (value: string) => void;
  editPostCoverUrl: string;
  setEditPostCoverUrl: (value: string) => void;
  createPost: () => Promise<void>;
  uploadPostFile: (file: File) => Promise<void>;
  togglePostHidden: (item: PostItem) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  startEditPost: (post: PostItem) => void;
  cancelEditPost: () => void;
  savePostEdit: () => Promise<void>;
};

/**
 * 博文管理面板：创建、文件上传、列表操作。
 */
export function PostsPanel({ posts, form }: { posts: PostItem[]; form: PostFormState }) {
  return (
    <section className="space-y-3 rounded border p-4">
      <h2 className="text-lg font-semibold">新增博文</h2>
      <div className="space-y-2">
        <input className="w-full rounded border px-2 py-1" placeholder="标题" value={form.newPostTitle} onChange={(e) => form.setNewPostTitle(e.target.value)} />
        <input className="w-full rounded border px-2 py-1" placeholder="类型（默认空）" value={form.newPostType} onChange={(e) => form.setNewPostType(e.target.value)} />
        <RichTextEditor value={form.newPostContent} onChange={form.setNewPostContent} placeholder="正文（HTML）" minHeightClassName="min-h-32" />
        <label className="inline-flex items-center gap-1">
          <input type="checkbox" checked={form.newPostIsHidden} onChange={(e) => form.setNewPostIsHidden(e.target.checked)} />
          隐藏
        </label>
        <button className="rounded border px-3 py-1" type="button" onClick={() => void form.createPost()}>
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
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.id} className="space-y-2 rounded border p-2">
            <div className="flex items-center justify-between">
              <span>
                #{post.id} {post.title} type={post.type || '(空)'} {post.isHidden ? '[隐藏]' : '[显示]'}
              </span>
              <div className="flex gap-2">
                <button className="rounded border px-2 py-1" type="button" onClick={() => form.startEditPost(post)}>
                  编辑
                </button>
                <button className="rounded border px-2 py-1" type="button" onClick={() => void form.togglePostHidden(post)}>
                  切换显示
                </button>
                <button className="rounded border px-2 py-1" type="button" onClick={() => void form.deletePost(post.id)}>
                  删除
                </button>
              </div>
            </div>
            {form.editingPostId === post.id ? (
              <div className="space-y-2 rounded border border-dashed p-3">
                <input
                  className="w-full rounded border px-2 py-1"
                  placeholder="标题"
                  value={form.editPostTitle}
                  onChange={(e) => form.setEditPostTitle(e.target.value)}
                />
                <input
                  className="w-full rounded border px-2 py-1"
                  placeholder="类型"
                  value={form.editPostType}
                  onChange={(e) => form.setEditPostType(e.target.value)}
                />
                <input
                  className="w-full rounded border px-2 py-1"
                  placeholder="封面 URL（可选）"
                  value={form.editPostCoverUrl}
                  onChange={(e) => form.setEditPostCoverUrl(e.target.value)}
                />
                <textarea
                  className="h-20 w-full rounded border px-2 py-1"
                  placeholder="摘要（可选）"
                  value={form.editPostExcerpt}
                  onChange={(e) => form.setEditPostExcerpt(e.target.value)}
                />
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.editPostIsHidden}
                    onChange={(e) => form.setEditPostIsHidden(e.target.checked)}
                  />
                  隐藏
                </label>
                <RichTextEditor
                  value={form.editPostContent}
                  onChange={form.setEditPostContent}
                  placeholder="编辑正文（HTML）"
                  toolbarRight={
                    <>
                      <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => void form.savePostEdit()}>
                        保存
                      </button>
                      <button className="rounded border px-2 py-1 text-xs" type="button" onClick={form.cancelEditPost}>
                        取消
                      </button>
                    </>
                  }
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
