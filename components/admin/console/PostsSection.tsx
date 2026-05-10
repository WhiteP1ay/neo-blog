'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import type { PostItem } from './types';
import { ZenPostEditor } from '@/components/admin/ZenPostEditor';
import { PostTable } from './posts/PostTable';

type PostFormState = {
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
  uploadPostFile: (file: File) => Promise<void>;
  togglePostHidden: (item: PostItem) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  startEditPost: (post: PostItem) => Promise<void>;
  cancelEditPost: () => void;
  reorderPosts: (orderedIds: number[]) => Promise<void>;
};

export function PostsSection({
  posts,
  form,
  selectedType = null,
}: {
  posts: PostItem[];
  form: PostFormState;
  /** 路径驱动的类型筛选，null 表示「全部」 */
  selectedType?: string | null;
}) {
  const queryClient = useQueryClient();
  const [openZenCreate, setOpenZenCreate] = useState(false);
  const mdFileInputRef = useRef<HTMLInputElement>(null);

  const zenEditOpen = form.editingPostId !== null;

  const invalidatePosts = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
  };

  return (
    <section className="space-y-3 rounded border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">博文管理</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setOpenZenCreate(true)}>
            新增博文
          </button>
          <button
            className="rounded border px-3 py-1 text-sm"
            type="button"
            onClick={() => mdFileInputRef.current?.click()}
          >
            上传 Markdown
          </button>
          <input
            ref={mdFileInputRef}
            type="file"
            accept=".md,text/markdown"
            className="sr-only"
            aria-hidden
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void form.uploadPostFile(file);
              event.target.value = '';
            }}
          />
        </div>
      </div>
      <PostTable posts={posts} form={form} selectedType={selectedType} />

      <ZenPostEditor
        mode="create"
        open={openZenCreate}
        onClose={() => setOpenZenCreate(false)}
        onCreated={invalidatePosts}
      />

      {zenEditOpen && form.editingPostId !== null ? (
        <ZenPostEditor
          mode="edit"
          open={zenEditOpen}
          postId={form.editingPostId}
          initialTitle={form.editPostTitle}
          initialType={form.editPostType}
          initialContent={form.editPostContent}
          isHidden={form.editPostIsHidden}
          excerpt={form.editPostExcerpt}
          coverUrl={form.editPostCoverUrl}
          onClose={form.cancelEditPost}
          onSaved={invalidatePosts}
          onDeleted={() => {
            form.cancelEditPost();
            invalidatePosts();
          }}
        />
      ) : null}
    </section>
  );
}
