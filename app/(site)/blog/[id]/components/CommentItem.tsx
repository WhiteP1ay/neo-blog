'use client';

import type { CommentWithReplies } from '@/server/actions/comments';
import { formatDateShort } from '@/app/utils/date';
import { Button } from '@/components/ui/button';

interface CommentItemProps {
  comment: CommentWithReplies;
  onReply: (commentId: number, author: string) => void;
}

/**
 * 评论项组件
 */
export function CommentItem({ comment, onReply }: CommentItemProps) {
  return (
    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{comment.author}</span>
          {comment.email && (
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1 sm:ml-2 break-all">
              ({comment.email})
            </span>
          )}
        </div>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatDateShort(comment.createdAt)}
        </span>
      </div>
      <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap wrap-break-word">
        {comment.content}
      </div>
      <Button onClick={() => onReply(comment.id, comment.author)}>回复</Button>

      {/* 渲染子评论 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 sm:mt-4 ml-2 sm:ml-6 pl-2 sm:pl-4 border-l-2 border-gray-200 dark:border-gray-600">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
