'use client';

import { useState } from 'react';
import type { PostItem } from '../types';
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
  startEditPost: (post: PostItem) => void;
  cancelEditPost: () => void;
  savePostEdit: () => Promise<void>;
  reorderPosts: (orderedIds: number[]) => Promise<void>;
};

export function PostsSection({ posts, form }: { posts: PostItem[]; form: PostFormState }) {
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <section className="space-y-3 rounded border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">博文管理</h2>
        <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setOpenCreate(true)}>
          新增博文
        </button>
      </div>
      <PostTable posts={posts} form={form} />
      <PostCreate open={openCreate} onClose={() => setOpenCreate(false)} form={form} />
    </section>
  );
}
