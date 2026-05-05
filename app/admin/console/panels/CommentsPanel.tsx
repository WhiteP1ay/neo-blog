'use client';

import type { CommentItem } from '../types';

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

/**
 * 评论管理面板：创建评论与删除评论。
 */
export function CommentsPanel({ comments, form }: { comments: CommentItem[]; form: CommentFormState }) {
  return (
    <section className="space-y-3 rounded border p-4">
      <h2 className="text-lg font-semibold">新增评论</h2>
      <div className="space-y-2">
        <select
          className="rounded border px-2 py-1"
          value={form.commentTargetType}
          onChange={(e) => form.setCommentTargetType(e.target.value as 'post' | 'photo')}
        >
          <option value="post">post</option>
          <option value="photo">photo</option>
        </select>
        <input className="w-full rounded border px-2 py-1" placeholder="targetId" value={form.commentTargetId} onChange={(e) => form.setCommentTargetId(e.target.value)} />
        <input className="w-full rounded border px-2 py-1" placeholder="作者" value={form.commentAuthor} onChange={(e) => form.setCommentAuthor(e.target.value)} />
        <textarea className="h-20 w-full rounded border px-2 py-1" placeholder="评论内容" value={form.commentContent} onChange={(e) => form.setCommentContent(e.target.value)} />
        <button className="rounded border px-3 py-1" type="button" onClick={() => void form.createComment()}>
          创建
        </button>
      </div>
      <ul className="space-y-2">
        {comments.map((comment) => (
          <li key={comment.id} className="flex items-center justify-between rounded border p-2">
            <span>
              #{comment.id} [{comment.targetType}:{comment.targetId}] {comment.author}: {comment.content}
            </span>
            <button className="rounded border px-2 py-1" type="button" onClick={() => void form.deleteComment(comment.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
