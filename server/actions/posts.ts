"use server";

import { db } from "@/server/db/db";
import { postsTable } from "@/server/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getSession } from "@/server/utils/auth";
import { buildPlainBody } from "@/server/utils/postPlainText";
import { buildSearchVectorSql } from "@/server/utils/searchIndex";

/**
 * 文章类型定义
 */
export type Post = {
  id: number;
  title: string;
  content: string;
  markdownContent: string | null;
  isPinned: boolean;
  plainBody: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type SearchPostResult = {
  id: number;
  title: string;
  isPinned: boolean;
  createdAt: Date | null;
  snippet: string | null;
  rank: number;
};

const MAX_SEARCH_QUERY_LENGTH = 100;
const DEFAULT_SEARCH_LIMIT = 20;

function buildSearchIndexFields(
  title: string,
  markdownContent: string | null | undefined
) {
  const plainBody = buildPlainBody(markdownContent);
  return {
    plainBody,
    searchVector: buildSearchVectorSql(title, plainBody),
  };
}

/**
 * Server Action: 获取所有文章列表（置顶文章在前，然后按创建时间倒序）
 */
export async function getPosts() {
  try {
    const posts = await db
      .select()
      .from(postsTable)
      .orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt));
    return { success: true, data: posts };
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return { success: false, error: "获取文章列表失败" };
  }
}

/**
 * Server Action: 根据ID获取单篇文章
 */
export async function getPostById(id: number) {
  try {
    const post = await db.query.postsTable.findFirst({
      where: (posts, { eq }) => eq(posts.id, id),
    });

    if (!post) {
      return { success: false, error: "文章不存在" };
    }

    return { success: true, data: post };
  } catch (error) {
    console.error("获取文章失败:", error);
    return { success: false, error: "获取文章失败" };
  }
}

/**
 * Server Action: 中文全文搜索（zhparser）
 */
export async function searchPosts(
  query: string,
  options?: { limit?: number; offset?: number }
) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { success: true, data: [] as SearchPostResult[] };
  }

  if (trimmed.length > MAX_SEARCH_QUERY_LENGTH) {
    return { success: false, error: "搜索关键词过长" };
  }

  const limit = Math.min(options?.limit ?? DEFAULT_SEARCH_LIMIT, 50);
  const offset = Math.max(options?.offset ?? 0, 0);

  try {
    const result = await db.execute<{
      id: number;
      title: string;
      isPinned: boolean;
      createdAt: Date | null;
      snippet: string | null;
      rank: number;
    }>(sql`
      SELECT
        p.id,
        p.title,
        p."isPinned",
        p."createdAt",
        ts_rank(p."searchVector", query) AS rank,
        ts_headline(
          'chinese',
          COALESCE(p."plainBody", ''),
          query,
          'MaxWords=60, MinWords=10, StartSel=<mark>, StopSel=</mark>'
        ) AS snippet
      FROM ${postsTable} p,
           plainto_tsquery('chinese', ${trimmed}) query
      WHERE p."searchVector" @@ query
      ORDER BY p."isPinned" DESC, rank DESC, p."createdAt" DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `);

    const rows = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      isPinned: row.isPinned,
      createdAt: row.createdAt,
      snippet: row.snippet,
      rank: Number(row.rank),
    }));

    return { success: true, data: rows };
  } catch (error) {
    console.error("搜索文章失败:", error);
    const message =
      error instanceof Error && error.message.includes("zhparser")
        ? "数据库未启用 zhparser 扩展，请使用带 zhparser 的 Postgres 镜像"
        : "搜索失败";
    return { success: false, error: message };
  }
}

/**
 * Server Action: 创建文章
 */
export async function createPost(data: {
  title: string;
  content: string;
  markdownContent?: string | null;
}) {
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: "未登录" };
  }

  try {
    const indexFields = buildSearchIndexFields(
      data.title,
      data.markdownContent
    );

    const result = await db
      .insert(postsTable)
      .values({
        title: data.title,
        content: data.content,
        markdownContent: data.markdownContent || null,
        plainBody: indexFields.plainBody,
        searchVector: indexFields.searchVector,
      })
      .returning();

    return { success: true, data: result[0] };
  } catch (error) {
    console.error("创建文章失败:", error);
    return { success: false, error: "创建文章失败" };
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
  }
) {
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: "未登录" };
  }

  try {
    const updateData: {
      title?: string;
      content?: string;
      markdownContent?: string | null;
      isPinned?: boolean;
      plainBody?: string;
      searchVector?: ReturnType<typeof buildSearchVectorSql>;
      createdAt?: Date | null;
      updatedAt?: Date | null;
    } = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.markdownContent !== undefined) {
      updateData.markdownContent = data.markdownContent;
    }
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

    if (data.title !== undefined || data.markdownContent !== undefined) {
      const existing = await db.query.postsTable.findFirst({
        where: (posts, { eq }) => eq(posts.id, id),
      });

      if (!existing) {
        return { success: false, error: "文章不存在" };
      }

      const title = data.title ?? existing.title;
      const markdown =
        data.markdownContent !== undefined
          ? data.markdownContent
          : existing.markdownContent;
      const indexFields = buildSearchIndexFields(title, markdown);
      updateData.plainBody = indexFields.plainBody;
      updateData.searchVector = indexFields.searchVector;
    }

    const result = await db
      .update(postsTable)
      .set(updateData)
      .where(eq(postsTable.id, id))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "文章不存在" };
    }

    return { success: true, data: result[0] };
  } catch (error) {
    console.error("更新文章失败:", error);
    return { success: false, error: "更新文章失败" };
  }
}

/**
 * Server Action: 删除文章
 */
export async function deletePost(id: number) {
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: "未登录" };
  }

  try {
    const result = await db
      .delete(postsTable)
      .where(eq(postsTable.id, id))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "文章不存在" };
    }

    return { success: true };
  } catch (error) {
    console.error("删除文章失败:", error);
    return { success: false, error: "删除文章失败" };
  }
}
