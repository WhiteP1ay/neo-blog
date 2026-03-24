'use server';

import { db } from '@/server/db/db';
import { postsTable, topicsTable, topicPostsTable } from '@/server/db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { getSession } from '@/server/utils/auth';
import { highlightCodeBlocksInHtml } from '@/server/utils/highlight-code-blocks-in-html';
import type { Topic } from './topics';

/**
 * 文章类型定义
 */
export type Post = {
  id: number;
  title: string;
  content: string;
  markdownContent: string | null;
  isPinned: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

/**
 * 列表项类型（专题或文章）
 */
export type ListItem =
  | {
      type: 'topic';
      data: Topic & {
        posts: Array<{ id: number; title: string; createdAt: Date | null }>;
      };
    }
  | { type: 'post'; data: Post };

/**
 * Server Action: 获取所有文章列表（置顶文章在前，然后按创建时间倒序）
 */
export async function getPosts() {
  try {
    const posts = await db.select().from(postsTable).orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt));
    return { success: true, data: posts };
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return { success: false, error: '获取文章列表失败' };
  }
}

/** 首页侧边列表用：仅必要字段 */
export type HomePostPreview = {
  id: number;
  title: string;
  createdAt: Date | null;
  isPinned: boolean;
};

/**
 * 首页最近文章（置顶优先，再按创建时间倒序）
 */
export async function getLatestPostsForHome(limit = 5) {
  try {
    const rows = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        createdAt: postsTable.createdAt,
        isPinned: postsTable.isPinned,
      })
      .from(postsTable)
      .orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt))
      .limit(limit);
    return { success: true as const, data: rows as HomePostPreview[] };
  } catch (error) {
    console.error('获取首页文章失败:', error);
    return { success: false as const, error: '获取文章失败' };
  }
}

/** 首页三栏：单篇列表项（含置顶标记） */
export type HomeExplorerPostPreview = {
  id: number;
  title: string;
  createdAt: Date | null;
  isPinned: boolean;
};

/**
 * 首页三栏：左侧分类；topicKey 为未分类或真实专题 id
 */
export type HomeExplorerCategory = {
  topicKey: 'uncategorized' | number;
  name: string;
  isPinned: boolean;
  /** 未分类为 0；真实专题为库内 sortOrder */
  sortOrder: number;
  createdAt: Date | null;
  posts: HomeExplorerPostPreview[];
};

/**
 * 首页备忘录式浏览：未分类（无专题文章）+ 各可见专题及其文章列表
 */
export async function getHomeExplorerData() {
  try {
    const allTopicPosts = await db.select({ postId: topicPostsTable.postId }).from(topicPostsTable);
    const topicPostIds = new Set(allTopicPosts.map((tp) => tp.postId));

    const allPostRows = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        createdAt: postsTable.createdAt,
        isPinned: postsTable.isPinned,
      })
      .from(postsTable)
      .orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt));

    const uncategorizedPosts = allPostRows.filter((p) => !topicPostIds.has(p.id));

    const categories: HomeExplorerCategory[] = [
      {
        topicKey: 'uncategorized',
        name: '未分类',
        isPinned: false,
        sortOrder: 0,
        createdAt: null,
        posts: uncategorizedPosts,
      },
    ];

    const topics = await db
      .select()
      .from(topicsTable)
      .where(eq(topicsTable.isHidden, false))
      .orderBy(desc(topicsTable.isPinned), asc(topicsTable.sortOrder), desc(topicsTable.createdAt));

    for (const topic of topics) {
      const topicPosts = await db.query.topicPostsTable.findMany({
        where: (topicPosts, { eq }) => eq(topicPosts.topicId, topic.id),
        orderBy: (topicPosts, { asc }) => [asc(topicPosts.sortOrder)],
        with: {
          post: {
            columns: {
              id: true,
              title: true,
              createdAt: true,
              isPinned: true,
            },
          },
        },
      });

      categories.push({
        topicKey: topic.id,
        name: topic.name,
        isPinned: topic.isPinned,
        sortOrder: topic.sortOrder,
        createdAt: topic.createdAt,
        posts: topicPosts.map((tp) => ({
          id: tp.post.id,
          title: tp.post.title,
          createdAt: tp.post.createdAt,
          isPinned: tp.post.isPinned,
        })),
      });
    }

    return { success: true as const, data: categories };
  } catch (error) {
    console.error('获取首页浏览数据失败:', error);
    return { success: false as const, error: '获取首页浏览数据失败' };
  }
}

/**
 * Server Action: 获取混合列表（专题+文章，用于首页展示）
 * @param showTopics 是否显示专题
 */
export async function getMixedList(showTopics = true) {
  try {
    const items: ListItem[] = [];

    // 获取专题（如果启用）
    if (showTopics) {
      const topics = await db
        .select()
        .from(topicsTable)
        .where(eq(topicsTable.isHidden, false))
        .orderBy(desc(topicsTable.isPinned), asc(topicsTable.sortOrder), desc(topicsTable.createdAt));

      for (const topic of topics) {
        // 获取专题下的文章
        const topicPosts = await db.query.topicPostsTable.findMany({
          where: (topicPosts, { eq }) => eq(topicPosts.topicId, topic.id),
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
        });

        items.push({
          type: 'topic',
          data: {
            ...topic,
            posts: topicPosts.map((tp) => ({
              id: tp.post.id,
              title: tp.post.title,
              createdAt: tp.post.createdAt,
            })),
          },
        });
      }
    }

    // 获取不属于任何专题的文章
    const allTopicPosts = await db.select({ postId: topicPostsTable.postId }).from(topicPostsTable);

    const topicPostIds = new Set(allTopicPosts.map((tp) => tp.postId));

    // 获取所有文章，然后过滤出不属于专题的
    const allPosts = await db.select().from(postsTable).orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt));

    const standalonePosts = allPosts.filter((post) => !topicPostIds.has(post.id));

    for (const post of standalonePosts) {
      items.push({
        type: 'post',
        data: post,
      });
    }

    // 按置顶优先，然后按创建时间倒序排序（专题和文章混合）
    items.sort((a, b) => {
      // 置顶优先
      const aPinned = a.type === 'topic' ? a.data.isPinned : a.data.isPinned;
      const bPinned = b.type === 'topic' ? b.data.isPinned : b.data.isPinned;

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // 然后按创建时间倒序
      const aDate = a.type === 'topic' ? a.data.createdAt : a.data.createdAt;
      const bDate = b.type === 'topic' ? b.data.createdAt : b.data.createdAt;

      if (!aDate || !bDate) {
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
      }

      return bDate.getTime() - aDate.getTime();
    });

    return { success: true, data: items };
  } catch (error) {
    console.error('获取混合列表失败:', error);
    return { success: false, error: '获取混合列表失败' };
  }
}

/**
 * Server Action: 根据ID获取单篇文章
 * @param highlightCode true 时对正文中的 pre/code 做 Shiki 服务端高亮（编辑页、导出等应传 false 保持原始 HTML）
 */
export async function getPostById(id: number, highlightCode = false) {
  try {
    const post = await db.query.postsTable.findFirst({
      where: (posts, { eq }) => eq(posts.id, id),
    });

    if (!post) {
      return { success: false, error: '文章不存在' };
    }

    if (!highlightCode) {
      return { success: true, data: post };
    }

    const content = await highlightCodeBlocksInHtml(post.content);
    return { success: true, data: { ...post, content } };
  } catch (error) {
    console.error('获取文章失败:', error);
    return { success: false, error: '获取文章失败' };
  }
}

/**
 * Server Action: 创建文章
 */
export async function createPost(data: { title: string; content: string; markdownContent?: string | null }) {
  // 检查登录状态
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: '未登录' };
  }

  try {
    const result = await db
      .insert(postsTable)
      .values({
        title: data.title,
        content: data.content,
        markdownContent: data.markdownContent || null,
      })
      .returning();

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('创建文章失败:', error);
    return { success: false, error: '创建文章失败' };
  }
}

/**
 * Server Action: 更新文章
 */
export async function updatePost(
  id: number,
  data: {
    title?: string;
    content?: string;
    markdownContent?: string | null;
    isPinned?: boolean;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  },
) {
  // 检查登录状态
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: '未登录' };
  }

  try {
    const updateData: {
      title?: string;
      content?: string;
      markdownContent?: string | null;
      isPinned?: boolean;
      createdAt?: Date | null;
      updatedAt?: Date | null;
    } = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.markdownContent !== undefined) updateData.markdownContent = data.markdownContent;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;

    // 处理创建日期：允许设置为null
    if (data.createdAt !== undefined) {
      updateData.createdAt = data.createdAt;
    }

    // 处理修改日期：允许设置为null
    if (data.updatedAt !== undefined) {
      updateData.updatedAt = data.updatedAt;
    } else if (data.title !== undefined || data.content !== undefined || data.isPinned !== undefined) {
      // 如果更新了标题、内容或置顶状态，自动更新 updatedAt
      updateData.updatedAt = new Date();
    }

    const result = await db.update(postsTable).set(updateData).where(eq(postsTable.id, id)).returning();

    if (result.length === 0) {
      return { success: false, error: '文章不存在' };
    }

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新文章失败:', error);
    return { success: false, error: '更新文章失败' };
  }
}

/**
 * Server Action: 删除文章
 */
export async function deletePost(id: number) {
  // 检查登录状态
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: '未登录' };
  }

  try {
    const result = await db.delete(postsTable).where(eq(postsTable.id, id)).returning();

    if (result.length === 0) {
      return { success: false, error: '文章不存在' };
    }

    return { success: true };
  } catch (error) {
    console.error('删除文章失败:', error);
    return { success: false, error: '删除文章失败' };
  }
}
