'use client';

import { Fragment, useMemo, useState } from 'react';
import type { PostItem } from '../../types';
import { RichTextEditor } from '../RichTextEditor';

type PostTableProps = {
  posts: PostItem[];
  form: {
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
    togglePostHidden: (item: PostItem) => Promise<void>;
    deletePost: (id: number) => Promise<void>;
    startEditPost: (post: PostItem) => void;
    cancelEditPost: () => void;
    savePostEdit: () => Promise<void>;
  };
};

export function PostTable({ posts, form }: PostTableProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const types = useMemo(
    () => Array.from(new Set(posts.map((post) => post.type))).sort((a, b) => a.localeCompare(b)),
    [posts],
  );
  const visiblePosts = useMemo(() => {
    if (selectedTypes.length === 0) return posts;
    return posts.filter((post) => selectedTypes.includes(post.type));
  }, [posts, selectedTypes]);

  const toggleType = (type: string) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  };

  return (
    <div className="space-y-3">
      <div className="rounded border p-3">
        <p className="mb-2 text-xs text-muted-foreground">按类型筛选（不选=全部）</p>
        <div className="flex flex-wrap gap-3">
          {types.map((type) => (
            <label key={type || '__empty'} className="inline-flex items-center gap-1 text-sm">
              <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} />
              {type || '(空)'}
            </label>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">标题</th>
              <th className="px-3 py-2">类型</th>
              <th className="px-3 py-2">状态</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {visiblePosts.map((post) => (
              <Fragment key={post.id}>
                <tr className="border-b">
                  <td className="px-3 py-2">{post.id}</td>
                  <td className="px-3 py-2">{post.title}</td>
                  <td className="px-3 py-2">{post.type || '(空)'}</td>
                  <td className="px-3 py-2">{post.isHidden ? '隐藏' : '显示'}</td>
                  <td className="px-3 py-2">
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
                  </td>
                </tr>
                {form.editingPostId === post.id ? (
                  <tr className="border-b bg-muted/20">
                    <td className="px-3 py-3" colSpan={5}>
                      <div className="space-y-2 rounded border border-dashed p-3">
                        <input className="w-full rounded border px-2 py-1" placeholder="标题" value={form.editPostTitle} onChange={(e) => form.setEditPostTitle(e.target.value)} />
                        <input className="w-full rounded border px-2 py-1" placeholder="类型" value={form.editPostType} onChange={(e) => form.setEditPostType(e.target.value)} />
                        <input className="w-full rounded border px-2 py-1" placeholder="封面 URL（可选）" value={form.editPostCoverUrl} onChange={(e) => form.setEditPostCoverUrl(e.target.value)} />
                        <textarea className="h-20 w-full rounded border px-2 py-1" placeholder="摘要（可选）" value={form.editPostExcerpt} onChange={(e) => form.setEditPostExcerpt(e.target.value)} />
                        <label className="inline-flex items-center gap-1">
                          <input type="checkbox" checked={form.editPostIsHidden} onChange={(e) => form.setEditPostIsHidden(e.target.checked)} />
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
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
