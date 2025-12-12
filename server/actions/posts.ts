"use server";

import { db } from "@/server/db/db";
import { postsTable } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/server/utils/auth";

/**
 * 文章类型定义
 */
export type Post = {
  id: number;
  title: string;
  content: string;
  markdownContent: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Server Action: 获取所有文章列表（按创建时间倒序）
 */
export async function getPosts() {
  try {
    const posts = await db
      .select()
      .from(postsTable)
      .orderBy(desc(postsTable.createdAt));
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
 * Server Action: 创建文章
 */
export async function createPost(data: {
  title: string;
  content: string;
  markdownContent?: string | null;
}) {
  // 检查登录状态
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: "未登录" };
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
    console.error("创建文章失败:", error);
    return { success: false, error: "创建文章失败" };
  }
}

/**
 * Server Action: 更新文章
 */
export async function updatePost(id: number, data: {
  title: string;
  content: string;
  markdownContent?: string | null;
}) {
  // 检查登录状态
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: "未登录" };
  }

  try {
    const result = await db
      .update(postsTable)
      .set({
        title: data.title,
        content: data.content,
        markdownContent: data.markdownContent || null,
        updatedAt: new Date(),
      })
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
  // 检查登录状态
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

