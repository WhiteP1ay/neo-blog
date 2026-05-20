'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import type { PostItem, PostTypeAdminRow } from './types';
import { ZenPostEditor } from '@/components/admin/ZenPostEditor';
import { PostAiPolishDialog } from './posts/PostAiPolishDialog';
import { PostTable } from './posts/PostTable';

type PostFormState = {
  uploadPostFile: (file: File) => Promise<void>;
  togglePostHidden: (item: PostItem) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  reorderPosts: (orderedIds: number[], typeId: number) => Promise<void>;
};

export function PostsSection({
  posts,
  postTypes,
  form,
  selectedType = null,
}: {
  posts: PostItem[];
  postTypes: PostTypeAdminRow[];
  form: PostFormState;
  /** 路径驱动的类型筛选，null 表示「全部」 */
  selectedType?: string | null;
}) {
  const queryClient = useQueryClient();
  const [openZenCreate, setOpenZenCreate] = useState(false);
  const [aiPolishPost, setAiPolishPost] = useState<PostItem | null>(null);
  const mdFileInputRef = useRef<HTMLInputElement>(null);

  const invalidatePosts = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
  };

  const postTableForm = {
    ...form,
    openAiPolish: (post: PostItem) => setAiPolishPost(post),
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
      <PostTable posts={posts} typeCatalog={postTypes} form={postTableForm} selectedType={selectedType} />

      <PostAiPolishDialog
        post={aiPolishPost}
        open={aiPolishPost !== null}
        onOpenChange={(next) => {
          if (!next) setAiPolishPost(null);
        }}
      />

      <ZenPostEditor
        mode="create"
        open={openZenCreate}
        availableTypes={postTypes}
        onClose={() => setOpenZenCreate(false)}
        onCreated={invalidatePosts}
      />
    </section>
  );
}
