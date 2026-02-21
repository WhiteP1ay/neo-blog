'use server';

import { db } from '@/server/db/db';
import { topicsTable, topicPostsTable } from '@/server/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { getSession } from '@/server/utils/auth';

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
      .orderBy(desc(topicsTable.isPinned), desc(topicsTable.createdAt));
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
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: '未登录' };
  }

  try {
    const result = await db
      .insert(topicsTable)
      .values({
        name: data.name,
        description: data.description || null,
        coverImage: data.coverImage || null,
        isPinned: data.isPinned || false,
        isHidden: data.isHidden || false,
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
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: '未登录' };
  }

  try {
    const updateData: {
      name?: string;
      description?: string | null;
      coverImage?: string | null;
      isPinned?: boolean;
      isHidden?: boolean;
      updatedAt?: Date;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
    if (data.isHidden !== undefined) updateData.isHidden = data.isHidden;
    updateData.updatedAt = new Date();

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
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: '未登录' };
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
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: '未登录' };
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
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: '未登录' };
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
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: '未登录' };
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
