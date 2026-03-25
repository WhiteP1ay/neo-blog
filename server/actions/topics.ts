'use server';

import { db } from '@/server/db/db';
import { topicsTable, topicPostsTable } from '@/server/db/schema';
import { and, asc, desc, eq, max, ne } from 'drizzle-orm';
import { getSession, requireAdminSession } from '@/server/utils/auth';

/**
 * 专题类型定义
 */
export type Topic = {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  isPinned: boolean;
  isHidden: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 专题与文章关联类型
 */
export type TopicPost = {
  id: number;
  topicId: number;
  postId: number;
  sortOrder: number;
  createdAt: Date;
};

/**
 * 带文章列表的专题类型
 */
export type TopicWithPosts = Topic & {
  posts: Array<{
    id: number;
    postId: number;
    sortOrder: number;
    post: {
      id: number;
      title: string;
      createdAt: Date | null;
    };
  }>;
};

/**
 * Server Action: 获取所有专题列表（置顶优先，然后按创建时间倒序）
 */
export async function getTopics(includeHidden = false) {
  try {
    const topics = await db
      .select()
      .from(topicsTable)
      .where(includeHidden ? undefined : eq(topicsTable.isHidden, false))
      .orderBy(desc(topicsTable.isPinned), asc(topicsTable.sortOrder), desc(topicsTable.createdAt));
    return { success: true, data: topics };
  } catch (error) {
    console.error('获取专题列表失败:', error);
    return { success: false, error: '获取专题列表失败' };
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
      return { success: false, error: '专题不存在' };
    }

    return { success: true, data: topic };
  } catch (error) {
    console.error('获取专题失败:', error);
    return { success: false, error: '获取专题失败' };
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
}) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return { success: false, error: gate.error };
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

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('创建专题失败:', error);
    return { success: false, error: '创建专题失败' };
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
) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  try {
    const existing = await db.query.topicsTable.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.id, id),
    });
    if (!existing) {
      return { success: false, error: '专题不存在' };
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
      return { success: false, error: '专题不存在' };
    }

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新专题失败:', error);
    return { success: false, error: '更新专题失败' };
  }
}

/**
 * Server Action: 删除专题
 */
export async function deleteTopic(id: number) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  try {
    const result = await db.delete(topicsTable).where(eq(topicsTable.id, id)).returning();

    if (result.length === 0) {
      return { success: false, error: '专题不存在' };
    }

    return { success: true };
  } catch (error) {
    console.error('删除专题失败:', error);
    return { success: false, error: '删除专题失败' };
  }
}

/**
 * Server Action: 为专题添加文章
 */
export async function addPostToTopic(topicId: number, postId: number, sortOrder?: number) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  try {
    // 检查是否已存在
    const existing = await db.query.topicPostsTable.findFirst({
      where: (topicPosts, { and, eq }) => and(eq(topicPosts.topicId, topicId), eq(topicPosts.postId, postId)),
    });

    if (existing) {
      return { success: false, error: '文章已在该专题中' };
    }

    // 如果没有指定排序，获取当前最大排序值
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

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('添加文章到专题失败:', error);
    return { success: false, error: '添加文章到专题失败' };
  }
}

/**
 * Server Action: 从专题中移除文章
 */
export async function removePostFromTopic(topicId: number, postId: number) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  try {
    const result = await db
      .delete(topicPostsTable)
      .where(and(eq(topicPostsTable.topicId, topicId), eq(topicPostsTable.postId, postId)))
      .returning();

    if (result.length === 0) {
      return { success: false, error: '文章不在该专题中' };
    }

    return { success: true };
  } catch (error) {
    console.error('从专题中移除文章失败:', error);
    return { success: false, error: '从专题中移除文章失败' };
  }
}

/**
 * Server Action: 更新专题内文章的排序
 */
export async function updateTopicPostSortOrder(
  topicId: number,
  postOrders: Array<{ postId: number; sortOrder: number }>,
) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  try {
    // 使用事务批量更新
    await db.transaction(async (tx) => {
      for (const { postId, sortOrder } of postOrders) {
        await tx
          .update(topicPostsTable)
          .set({ sortOrder })
          .where(and(eq(topicPostsTable.topicId, topicId), eq(topicPostsTable.postId, postId)));
      }
    });

    return { success: true };
  } catch (error) {
    console.error('更新专题文章排序失败:', error);
    return { success: false, error: '更新专题文章排序失败' };
  }
}

/**
 * Server Action: 更新专题在侧边栏的排序（仅调整 sortOrder，不改变 isPinned）
 */
export async function updateTopicsSortOrder(topicOrders: Array<{ topicId: number; sortOrder: number }>) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return { success: false as const, error: gate.error };
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

    return { success: true as const };
  } catch (error) {
    console.error('更新专题排序失败:', error);
    return { success: false as const, error: '更新专题排序失败' };
  }
}

/**
 * Server Action: 将文章移动到目标专题（备忘录式「单一归属」：先清空所有专题关联，未分类则仅清空）
 */
export async function movePostToTopicTarget(postId: number, targetTopicKey: 'uncategorized' | number) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return { success: false as const, error: gate.error };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(topicPostsTable).where(eq(topicPostsTable.postId, postId));

      if (targetTopicKey === 'uncategorized') {
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

    return { success: true as const };
  } catch (error) {
    if (error instanceof Error && error.message === 'TOPIC_NOT_FOUND') {
      return { success: false as const, error: '专题不存在' };
    }
    console.error('移动文章到专题失败:', error);
    return { success: false as const, error: '移动文章失败' };
  }
}

/**
 * Server Action: 获取文章所属的所有专题
 */
export async function getTopicsByPostId(postId: number) {
  try {
    const topicPosts = await db.query.topicPostsTable.findMany({
      where: (topicPosts, { eq }) => eq(topicPosts.postId, postId),
      with: {
        topic: true,
      },
      orderBy: (topicPosts, { asc }) => [asc(topicPosts.sortOrder)],
    });

    return {
      success: true,
      data: topicPosts.map((tp) => tp.topic),
    };
  } catch (error) {
    console.error('获取文章所属专题失败:', error);
    return { success: false, error: '获取文章所属专题失败' };
  }
}

/**
 * Server Action: 获取专题内文章的上一篇和下一篇
 */
export async function getTopicPostNavigation(topicId: number, postId: number) {
  try {
    const currentPost = await db.query.topicPostsTable.findFirst({
      where: (topicPosts, { and, eq }) => and(eq(topicPosts.topicId, topicId), eq(topicPosts.postId, postId)),
    });

    if (!currentPost) {
      return { success: true, data: { prev: null, next: null } };
    }

    // 获取上一篇
    const prevPost = await db.query.topicPostsTable.findFirst({
      where: (topicPosts, { and, eq, lt }) =>
        and(eq(topicPosts.topicId, topicId), lt(topicPosts.sortOrder, currentPost.sortOrder)),
      orderBy: (topicPosts, { desc }) => [desc(topicPosts.sortOrder)],
      with: {
        post: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
    });

    // 获取下一篇
    const nextPost = await db.query.topicPostsTable.findFirst({
      where: (topicPosts, { and, eq, gt }) =>
        and(eq(topicPosts.topicId, topicId), gt(topicPosts.sortOrder, currentPost.sortOrder)),
      orderBy: (topicPosts, { asc }) => [asc(topicPosts.sortOrder)],
      with: {
        post: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        prev: prevPost?.post || null,
        next: nextPost?.post || null,
      },
    };
  } catch (error) {
    console.error('获取专题文章导航失败:', error);
    return { success: false, error: '获取专题文章导航失败' };
  }
}
