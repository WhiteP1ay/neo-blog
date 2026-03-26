'use server';

import { db } from '@/server/db/db';
import { topicsTable, topicPostsTable } from '@/server/db/schema';
import { and, asc, desc, eq, max, ne } from 'drizzle-orm';
import { getSession, requireAdminSession } from '@/server/utils/auth';
import { actionErr, actionOk, actionOkVoid } from '@/server/types/action-result';
import type { ActionResult, ActionVoidResult } from '@/server/types/action-result';
import type { Topic, TopicPost } from '@/server/types/models';

/**
 * Server Action: 获取所有专题列表（置顶优先，然后按创建时间倒序）
 */
export async function getTopics(includeHidden = false): Promise<ActionResult<Topic[]>> {
  try {
    const topics = await db
      .select()
      .from(topicsTable)
      .where(includeHidden ? undefined : eq(topicsTable.isHidden, false))
      .orderBy(desc(topicsTable.isPinned), asc(topicsTable.sortOrder), desc(topicsTable.createdAt));
    return actionOk(topics);
  } catch (error) {
    console.error('获取专题列表失败:', error);
    return actionErr('获取专题列表失败');
  }
}

/**
 * Server Action: 根据ID获取专题（包含文章列表）
 */
export async function getTopicById(id: number) {
  try {
    const topic = await db.query.topicsTable.findFirst({
      where: (topics, { eq }) => eq(topics.id, id),
      with: {
        topicPosts: {
          orderBy: (topicPosts, { asc }) => [asc(topicPosts.sortOrder)],
          with: {
            post: {
              columns: {
                id: true,
                title: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!topic) {
      return actionErr('专题不存在');
    }

    return actionOk(topic);
  } catch (error) {
    console.error('获取专题失败:', error);
    return actionErr('获取专题失败');
  }
}

/**
 * Server Action: 创建专题
 */
export async function createTopic(data: {
  name: string;
  description?: string | null;
  coverImage?: string | null;
  isPinned?: boolean;
  isHidden?: boolean;
}): Promise<ActionResult<Topic>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const pinned = data.isPinned || false;
    const maxRow = await db
      .select({ m: max(topicsTable.sortOrder) })
      .from(topicsTable)
      .where(and(eq(topicsTable.isPinned, pinned), eq(topicsTable.isHidden, data.isHidden || false)));

    const nextSort = (maxRow[0]?.m ?? -1) + 1;

    const result = await db
      .insert(topicsTable)
      .values({
        name: data.name,
        description: data.description || null,
        coverImage: data.coverImage || null,
        isPinned: pinned,
        isHidden: data.isHidden || false,
        sortOrder: nextSort,
      })
      .returning();

    return actionOk(result[0]);
  } catch (error) {
    console.error('创建专题失败:', error);
    return actionErr('创建专题失败');
  }
}

/**
 * Server Action: 更新专题
 */
export async function updateTopic(
  id: number,
  data: {
    name?: string;
    description?: string | null;
    coverImage?: string | null;
    isPinned?: boolean;
    isHidden?: boolean;
  },
): Promise<ActionResult<Topic>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const existing = await db.query.topicsTable.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.id, id),
    });
    if (!existing) {
      return actionErr('专题不存在');
    }

    const updateData: {
      name?: string;
      description?: string | null;
      coverImage?: string | null;
      isPinned?: boolean;
      isHidden?: boolean;
      sortOrder?: number;
      updatedAt?: Date;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
    if (data.isHidden !== undefined) updateData.isHidden = data.isHidden;
    updateData.updatedAt = new Date();

    const nextHidden = data.isHidden !== undefined ? data.isHidden : existing.isHidden;
    if (data.isPinned !== undefined && data.isPinned !== existing.isPinned) {
      const maxRow = await db
        .select({ m: max(topicsTable.sortOrder) })
        .from(topicsTable)
        .where(
          and(
            eq(topicsTable.isPinned, data.isPinned),
            eq(topicsTable.isHidden, nextHidden),
            ne(topicsTable.id, id),
          ),
        );
      updateData.sortOrder = (maxRow[0]?.m ?? -1) + 1;
    }

    const result = await db.update(topicsTable).set(updateData).where(eq(topicsTable.id, id)).returning();

    if (result.length === 0) {
      return actionErr('专题不存在');
    }

    return actionOk(result[0]);
  } catch (error) {
    console.error('更新专题失败:', error);
    return actionErr('更新专题失败');
  }
}

/**
 * Server Action: 删除专题
 */
export async function deleteTopic(id: number): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const result = await db.delete(topicsTable).where(eq(topicsTable.id, id)).returning();

    if (result.length === 0) {
      return actionErr('专题不存在');
    }

    return actionOkVoid();
  } catch (error) {
    console.error('删除专题失败:', error);
    return actionErr('删除专题失败');
  }
}

/**
 * Server Action: 为专题添加文章
 */
export async function addPostToTopic(topicId: number, postId: number, sortOrder?: number): Promise<ActionResult<TopicPost>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const existing = await db.query.topicPostsTable.findFirst({
      where: (topicPosts, { and, eq }) => and(eq(topicPosts.topicId, topicId), eq(topicPosts.postId, postId)),
    });

    if (existing) {
      return actionErr('文章已在该专题中');
    }

    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined) {
      const maxSort = await db
        .select()
        .from(topicPostsTable)
        .where(eq(topicPostsTable.topicId, topicId))
        .orderBy(desc(topicPostsTable.sortOrder))
        .limit(1);

      finalSortOrder = maxSort.length > 0 ? maxSort[0].sortOrder + 1 : 0;
    }

    const result = await db
      .insert(topicPostsTable)
      .values({
        topicId,
        postId,
        sortOrder: finalSortOrder,
      })
      .returning();

    return actionOk(result[0]);
  } catch (error) {
    console.error('添加文章到专题失败:', error);
    return actionErr('添加文章到专题失败');
  }
}

/**
 * Server Action: 从专题中移除文章
 */
export async function removePostFromTopic(topicId: number, postId: number): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const result = await db
      .delete(topicPostsTable)
      .where(and(eq(topicPostsTable.topicId, topicId), eq(topicPostsTable.postId, postId)))
      .returning();

    if (result.length === 0) {
      return actionErr('文章不在该专题中');
    }

    return actionOkVoid();
  } catch (error) {
    console.error('从专题中移除文章失败:', error);
    return actionErr('从专题中移除文章失败');
  }
}

/**
 * Server Action: 更新专题内文章的排序
 */
export async function updateTopicPostSortOrder(
  topicId: number,
  postOrders: Array<{ postId: number; sortOrder: number }>,
): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    await db.transaction(async (tx) => {
      for (const { postId, sortOrder } of postOrders) {
        await tx
          .update(topicPostsTable)
          .set({ sortOrder })
          .where(and(eq(topicPostsTable.topicId, topicId), eq(topicPostsTable.postId, postId)));
      }
    });

    return actionOkVoid();
  } catch (error) {
    console.error('更新专题文章排序失败:', error);
    return actionErr('更新专题文章排序失败');
  }
}

/**
 * Server Action: 更新专题在侧边栏的排序（仅调整 sortOrder，不改变 isPinned）
 */
export async function updateTopicsSortOrder(topicOrders: Array<{ topicId: number; sortOrder: number }>): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    await db.transaction(async (tx) => {
      for (const { topicId, sortOrder } of topicOrders) {
        await tx
          .update(topicsTable)
          .set({ sortOrder, updatedAt: new Date() })
          .where(eq(topicsTable.id, topicId));
      }
    });

    return actionOkVoid();
  } catch (error) {
    console.error('更新专题排序失败:', error);
    return actionErr('更新专题排序失败');
  }
}

/**
 * Server Action: 将文章移动到目标专题（备忘录式「单一归属」：先清空所有专题关联，未分类则仅清空）
 */
export async function movePostToTopicTarget(postId: number, targetTopicKey: number): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(topicPostsTable).where(eq(topicPostsTable.postId, postId));

      if (targetTopicKey === 0) {
        return;
      }

      const topicId = targetTopicKey;
      const topicRow = await tx.query.topicsTable.findFirst({
        where: (t, { eq: eqFn }) => eqFn(t.id, topicId),
      });
      if (!topicRow) {
        throw new Error('TOPIC_NOT_FOUND');
      }

      const maxRows = await tx
        .select()
        .from(topicPostsTable)
        .where(eq(topicPostsTable.topicId, topicId))
        .orderBy(desc(topicPostsTable.sortOrder))
        .limit(1);

      const nextOrder = maxRows.length > 0 ? maxRows[0].sortOrder + 1 : 0;

      await tx.insert(topicPostsTable).values({
        topicId,
        postId,
        sortOrder: nextOrder,
      });
    });

    return actionOkVoid();
  } catch (error) {
    if (error instanceof Error && error.message === 'TOPIC_NOT_FOUND') {
      return actionErr('专题不存在');
    }
    console.error('移动文章到专题失败:', error);
    return actionErr('移动文章失败');
  }
}
