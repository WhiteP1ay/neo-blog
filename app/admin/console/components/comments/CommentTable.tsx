'use client';

import type { CommentItem } from '../../types';

type CommentTableProps = {
  comments: CommentItem[];
  deleteComment: (id: number) => Promise<void>;
};

const deleteBtnClass =
  'min-h-10 shrink-0 touch-manipulation rounded border px-3 py-2 text-sm sm:min-h-0 sm:px-2 sm:py-1';

export function CommentTable({ comments, deleteComment }: CommentTableProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-xs text-muted-foreground">
                  #{comment.id} · {comment.targetType}:{comment.targetId}
                </p>
                <p className="text-sm font-medium">{comment.author}</p>
                <p className="wrap-break-word whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
              </div>
              <button className={deleteBtnClass} type="button" onClick={() => void deleteComment(comment.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded border md:block">
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
                <td className="max-w-md wrap-break-word whitespace-pre-wrap px-3 py-2">{comment.content}</td>
                <td className="px-3 py-2">
                  <button
                    className="rounded border px-2 py-1"
                    type="button"
                    onClick={() => void deleteComment(comment.id)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
