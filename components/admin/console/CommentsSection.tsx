'use client';

import { useState } from 'react';
import type { CommentItem } from './types';
import { CommentCreate } from './comments/CommentCreate';
import { CommentTable } from './comments/CommentTable';

type CommentFormState = {
  commentTargetType: 'post' | 'photo';
  setCommentTargetType: (value: 'post' | 'photo') => void;
  commentTargetId: string;
  setCommentTargetId: (value: string) => void;
  commentAuthor: string;
  setCommentAuthor: (value: string) => void;
  commentContent: string;
  setCommentContent: (value: string) => void;
  createComment: () => Promise<void>;
  deleteComment: (id: number) => Promise<void>;
};

export function CommentsSection({ comments, form }: { comments: CommentItem[]; form: CommentFormState }) {
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <section className="space-y-3 rounded border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">评论管理</h2>
        <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setOpenCreate(true)}>
          新增评论
        </button>
      </div>
      <CommentTable comments={comments} deleteComment={form.deleteComment} />
      <CommentCreate open={openCreate} onClose={() => setOpenCreate(false)} form={form} />
    </section>
  );
}
