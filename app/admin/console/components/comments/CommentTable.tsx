'use client';

import type { CommentItem } from '../../types';

type CommentTableProps = {
  comments: CommentItem[];
  deleteComment: (id: number) => Promise<void>;
};

export function CommentTable({ comments, deleteComment }: CommentTableProps) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className="px-3 py-2">ID</th>
            <th className="px-3 py-2">目标</th>
            <th className="px-3 py-2">作者</th>
            <th className="px-3 py-2">内容</th>
            <th className="px-3 py-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((comment) => (
            <tr key={comment.id} className="border-b align-top">
              <td className="px-3 py-2">{comment.id}</td>
              <td className="px-3 py-2">
                {comment.targetType}:{comment.targetId}
              </td>
              <td className="px-3 py-2">{comment.author}</td>
              <td className="px-3 py-2">{comment.content}</td>
              <td className="px-3 py-2">
                <button className="rounded border px-2 py-1" type="button" onClick={() => void deleteComment(comment.id)}>
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
