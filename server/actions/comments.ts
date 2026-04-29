/** biome-ignore-all lint/style/noNonNullAssertion: <todo> */
'use server';

import { db } from '@/server/db/db';
import { commentsTable } from '@/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { getSession, requireAdminSession } from '@/server/utils/auth';
import { getClientIP } from '@/server/utils/get-client-ip';
import { actionErr, actionOk, actionOkVoid } from '@/server/types/action-result';
import type { ActionResult, ActionVoidResult } from '@/server/types/action-result';
import type { CommentWithReplies } from '@/server/types/comments-thread';
import type { Comment } from '@/server/types/models';

export type CommentTargetType = 'post' | 'album' | 'photo';

/**
 * Server Action: 获取目标实体的所有评论
 * 返回树形结构
 */
export async function getCommentsByTarget(
  targetType: CommentTargetType,
  targetId: number,
): Promise<ActionResult<CommentWithReplies[]>> {
  if (!targetType || !Number.isFinite(targetId) || targetId <= 0) {
    return actionErr('缺少必要参数');
  }

  try {
    const comments = await db
      .select()
      .from(commentsTable)
      .where(and(eq(commentsTable.targetType, targetType), eq(commentsTable.targetId, targetId)))
      .orderBy(desc(commentsTable.createdAt));

    const commentMap = new Map<number, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)!;
        if (!parent.replies) {
          parent.replies = [];
        }
        parent.replies.push(commentWithReplies);
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return actionOk(rootComments);
  } catch (error) {
    console.error('获取评论失败:', error);
    return actionErr('获取评论失败');
  }
}

/**
 * Server Action: 创建评论
 */
export async function createComment(data: {
  targetType: CommentTargetType;
  targetId: number;
  parentId?: number | null;
  author: string;
  email?: string;
  content: string;
  /** 不传则从请求头解析；显式 `null` 表示不落库 IP */
  ip?: string | null;
}): Promise<ActionResult<Comment>> {
  if (!data.targetType || !data.targetId || !data.author || !data.content) {
    return actionErr('缺少必要参数');
  }

  const ip = data.ip ?? getClientIP(await headers());

  try {
    const result = await db
      .insert(commentsTable)
      .values({
        targetType: data.targetType,
        targetId: data.targetId,
        parentId: data.parentId || null,
        author: data.author,
        email: data.email || null,
        content: data.content,
        ip,
      })
      .returning();

    return actionOk(result[0]);
  } catch (error) {
    console.error('创建评论失败:', error);
    return actionErr('创建评论失败');
  }
}

/**
 * 向后兼容：文章评论读取接口。
 */
export async function getCommentsByPostId(postId: number): Promise<ActionResult<CommentWithReplies[]>> {
  return getCommentsByTarget('post', postId);
}

/**
 * Server Action: 删除评论
 */
export async function deleteComment(id: number): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const result = await db.delete(commentsTable).where(eq(commentsTable.id, id)).returning();

    if (result.length === 0) {
      return actionErr('评论不存在');
    }

    return actionOkVoid();
  } catch (error) {
    console.error('删除评论失败:', error);
    return actionErr('删除评论失败');
  }
}
