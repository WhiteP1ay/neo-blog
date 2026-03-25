'use client';

import type { CommentWithReplies } from '@/server/actions/comments';
import { formatDateShort } from '@/app/utils/date';
import { Button } from '@/components/ui/button';

interface CommentItemProps {
  comment: CommentWithReplies;
  onReply: (commentId: number, author: string) => void;
}

export function CommentItem({ comment, onReply }: CommentItemProps) {
  return (
    <div className="border-border mb-6 border-b pb-6 last:mb-0 last:border-0 last:pb-0">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-foreground text-sm font-semibold sm:text-base">{comment.author}</span>
          {comment.email ? (
            <span className="text-muted-foreground ml-1 break-all text-xs sm:ml-2 sm:text-sm">
              ({comment.email})
            </span>
          ) : null}
        </div>
        <span className="text-muted-foreground shrink-0 whitespace-nowrap text-xs sm:text-sm">
          {formatDateShort(comment.createdAt)}
        </span>
      </div>
      <div className="text-foreground mb-3 whitespace-pre-wrap wrap-break-word text-sm sm:text-base">
        {comment.content}
      </div>
      <Button type="button" onClick={() => onReply(comment.id, comment.author)}>
        回复
      </Button>

      {comment.replies && comment.replies.length > 0 ? (
        <div className="border-border mt-3 ml-2 border-l-2 pl-2 sm:mt-4 sm:ml-6 sm:pl-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
