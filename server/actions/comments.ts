/** biome-ignore-all lint/style/noNonNullAssertion: <todo> */
'use server';

import { db } from '@/server/db/db';
import { commentsTable } from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/server/utils/auth';

/**
 * 评论类型定义
 */
export type Comment = {
  id: number;
  postId: number;
  parentId: number | null;
  author: string;
  email: string | null;
  content: string;
  ip: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 带子评论的评论类型
 */
export type CommentWithReplies = Comment & {
  replies?: CommentWithReplies[];
};

/**
 * Server Action: 获取文章的所有评论
 * 返回树形结构
 */
export async function getCommentsByPostId(postId: number) {
  try {
    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.postId, postId))
      .orderBy(desc(commentsTable.createdAt));

    // 构建树形结构
    const commentMap = new Map<number, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // 先创建所有评论的映射
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // 构建树形结构
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parentId && commentMap.has(comment.parentId)) {
        // 有父评论，添加到父评论的replies中
        const parent = commentMap.get(comment.parentId)!;
        if (!parent.replies) {
          parent.replies = [];
        }
        parent.replies.push(commentWithReplies);
      } else {
        // 顶级评论
        rootComments.push(commentWithReplies);
      }
    });

    return { success: true, data: rootComments };
  } catch (error) {
    console.error('获取评论失败:', error);
    return { success: false, error: '获取评论失败' };
  }
}

/**
 * Server Action: 创建评论
 */
export async function createComment(data: {
  postId: number;
  parentId?: number | null;
  author: string;
  email?: string;
  content: string;
  ip?: string;
}) {
  try {
    const result = await db
      .insert(commentsTable)
      .values({
        postId: data.postId,
        parentId: data.parentId || null,
        author: data.author,
        email: data.email || null,
        content: data.content,
        ip: data.ip || null,
      })
      .returning();

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('创建评论失败:', error);
    return { success: false, error: '创建评论失败' };
  }
}

/**
 * Server Action: 删除评论
 */
export async function deleteComment(id: number) {
  // 检查登录状态
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: '未登录' };
  }

  try {
    const result = await db.delete(commentsTable).where(eq(commentsTable.id, id)).returning();

    if (result.length === 0) {
      return { success: false, error: '评论不存在' };
    }

    return { success: true };
  } catch (error) {
    console.error('删除评论失败:', error);
    return { success: false, error: '删除评论失败' };
  }
}
