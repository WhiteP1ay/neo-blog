'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAdminSettings } from '@/stores/admin/settings';
import type { PostItem } from '../types';
import { ZenPostEditor } from '@/components/admin/ZenPostEditor';
import { PostCreate } from './posts/PostCreate';
import { PostTable } from './posts/PostTable';

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
  startEditPost: (post: PostItem) => Promise<void>;
  cancelEditPost: () => void;
  savePostEdit: () => Promise<void>;
  reorderPosts: (orderedIds: number[]) => Promise<void>;
};

export function PostsSection({ posts, form }: { posts: PostItem[]; form: PostFormState }) {
  const editMode = useAdminSettings((state) => state.editMode);
  const queryClient = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [openZenCreate, setOpenZenCreate] = useState(false);

  const isZen = editMode === 'zen';
  const zenEditOpen = isZen && form.editingPostId !== null;

  const invalidatePosts = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
  };

  const handleNewClick = () => {
    if (isZen) {
      setOpenZenCreate(true);
    } else {
      setOpenCreate(true);
    }
  };

  return (
    <section className="space-y-3 rounded border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">博文管理</h2>
        <button className="rounded border px-3 py-1 text-sm" type="button" onClick={handleNewClick}>
          新增博文
        </button>
      </div>
      <PostTable posts={posts} form={form} />

      {/* 传统模式新增弹窗 */}
      <PostCreate open={!isZen && openCreate} onClose={() => setOpenCreate(false)} form={form} />

      {/* 禅模式：新增 */}
      {isZen ? (
        <ZenPostEditor
          mode="create"
          open={openZenCreate}
          onClose={() => setOpenZenCreate(false)}
          onCreated={invalidatePosts}
        />
      ) : null}

      {/* 禅模式：编辑（依赖 useAdminConsole 中 editPost* 状态由 PostTable 触发的 startEditPost 填充）*/}
      {isZen && zenEditOpen && form.editingPostId !== null ? (
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
        />
      ) : null}
    </section>
  );
}
