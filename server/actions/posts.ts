"use server";

import { db } from "@/server/db/db";
import { postsTable, topicsTable, topicPostsTable } from "@/server/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { getSession, requireAdminSession } from "@/server/utils/auth";
import { highlightCodeBlocksInHtml } from "@/server/utils/highlight-code-blocks-in-html";
import { markdownToHTML } from "@/server/utils/markdown";
import {
  actionErr,
  actionOk,
  actionOkVoid,
} from "@/server/types/action-result";
import type {
  ActionResult,
  ActionVoidResult,
} from "@/server/types/action-result";
import type {
  HomeExplorerCategory,
  HomePostPreview,
} from "@/server/types/explorer";
import type { Post } from "@/server/types/models";

/**
 * Server Action: 获取所有文章列表（置顶文章在前，然后按创建时间倒序）
 */
export async function getPosts(): Promise<ActionResult<Post[]>> {
  try {
    const posts = await db
      .select()
      .from(postsTable)
      .orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt));
    return actionOk(posts);
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return actionErr("获取文章列表失败");
  }
}

/**
 * 首页最近文章（置顶优先，再按创建时间倒序）
 */
export async function getLatestPostsForHome(
  limit = 5,
): Promise<ActionResult<HomePostPreview[]>> {
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
    return actionOk(rows as HomePostPreview[]);
  } catch (error) {
    console.error("获取首页文章失败:", error);
    return actionErr("获取文章失败");
  }
}

/**
 * 未分类（无专题文章）+ 各可见专题及其文章列表
 */
export async function getHomeExplorerData(): Promise<
  ActionResult<HomeExplorerCategory[]>
> {
  try {
    const allTopicPosts = await db
      .select({ postId: topicPostsTable.postId })
      .from(topicPostsTable);
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

    const uncategorizedPosts = allPostRows.filter(
      (p) => !topicPostIds.has(p.id),
    );

    const categories: HomeExplorerCategory[] = [
      {
        topicKey: 0,
        name: "未分类",
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
      .orderBy(
        desc(topicsTable.isPinned),
        asc(topicsTable.sortOrder),
        desc(topicsTable.createdAt),
      );

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

    return actionOk(categories);
  } catch (error) {
    console.error("获取首页浏览数据失败:", error);
    return actionErr("获取首页浏览数据失败");
  }
}

/**
 * Server Action: 根据ID获取单篇文章
 * @param highlightCode true 时对正文中的 pre/code 做 Shiki 服务端高亮（编辑页、导出等应传 false 保持原始 HTML）
 */
export async function getPostById(
  id: number,
  highlightCode = false,
): Promise<ActionResult<Post>> {
  try {
    const post = await db.query.postsTable.findFirst({
      where: (posts, { eq }) => eq(posts.id, id),
    });

    if (!post) {
      return actionErr("文章不存在");
    }

    if (!highlightCode) {
      return actionOk(post);
    }

    const content = await highlightCodeBlocksInHtml(post.content);
    return actionOk({ ...post, content });
  } catch (error) {
    console.error("获取文章失败:", error);
    return actionErr("获取文章失败");
  }
}

/**
 * Server Action: 创建文章
 */
export async function createPost(data: {
  title: string;
  content: string;
  markdownContent?: string | null;
}): Promise<ActionResult<Post>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
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

    return actionOk(result[0]);
  } catch (error) {
    console.error("创建文章失败:", error);
    return actionErr("创建文章失败");
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
): Promise<ActionResult<Post>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
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
    if (data.markdownContent !== undefined)
      updateData.markdownContent = data.markdownContent;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;

    if (data.createdAt !== undefined) {
      updateData.createdAt = data.createdAt;
    }

    if (data.updatedAt !== undefined) {
      updateData.updatedAt = data.updatedAt;
    } else if (
      data.title !== undefined ||
      data.content !== undefined ||
      data.isPinned !== undefined
    ) {
      updateData.updatedAt = new Date();
    }

    const result = await db
      .update(postsTable)
      .set(updateData)
      .where(eq(postsTable.id, id))
      .returning();

    if (result.length === 0) {
      return actionErr("文章不存在");
    }

    return actionOk(result[0]);
  } catch (error) {
    console.error("更新文章失败:", error);
    return actionErr("更新文章失败");
  }
}

/**
 * Server Action: 删除文章
 */
export async function deletePost(id: number): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const result = await db
      .delete(postsTable)
      .where(eq(postsTable.id, id))
      .returning();

    if (result.length === 0) {
      return actionErr("文章不存在");
    }

    return actionOkVoid();
  } catch (error) {
    console.error("删除文章失败:", error);
    return actionErr("删除文章失败");
  }
}

/**
 * Server Action: 管理员上传 Markdown 文件，创建新文章或覆盖指定文章的正文与标题
 */
export async function uploadMarkdownFromForm(
  formData: FormData,
): Promise<ActionResult<Post>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const file = formData.get("file") as File | null;
    const postIdRaw = formData.get("postId") as string | null;

    if (!file) {
      return actionErr("未找到文件");
    }

    const text = await file.text();

    let title = file.name.replace(/\.md$/i, "");
    const lines = text.split("\n");
    if (lines[0]?.startsWith("# ")) {
      title = lines[0].substring(2).trim();
    }

    const htmlContent = markdownToHTML(text);

    if (postIdRaw) {
      const result = await updatePost(Number.parseInt(postIdRaw, 10), {
        title,
        content: htmlContent,
        markdownContent: text,
      });

      if (!result.success) {
        return actionErr(result.error);
      }

      return actionOk(result.data);
    }

    const result = await createPost({
      title,
      content: htmlContent,
      markdownContent: text,
    });

    if (!result.success) {
      return actionErr(result.error);
    }

    return actionOk(result.data);
  } catch (error) {
    console.error("文件上传失败:", error);
    return actionErr("文件上传失败");
  }
}

/**
 * Server Action: 管理员上传图片（专题封面等，实际上传逻辑待接 OSS）
 */
export async function uploadAdminImageFromForm(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return actionErr("未找到文件");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return actionErr("不支持的图片格式，请上传 JPG、PNG、GIF 或 WebP 格式");
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return actionErr("图片大小不能超过 5MB");
    }

    // @todo 阿里云 OSS
    return actionOk({ url: "todo" });
  } catch (error) {
    console.error("图片上传失败:", error);
    return actionErr("图片上传失败");
  }
}
