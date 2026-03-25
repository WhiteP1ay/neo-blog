import type { Comment } from '@/server/types/models';

/** 带子评论的评论类型（树形） */
export type CommentWithReplies = Comment & {
  replies?: CommentWithReplies[];
};
