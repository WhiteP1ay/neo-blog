"use server";

import { db } from "@/server/db/db";
import { toolsTable } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/server/utils/auth";

/**
 * 工具类型定义
 */
export type Tool = {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  url: string;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Server Action: 获取所有工具列表（按创建时间倒序）
 */
export async function getTools(includeHidden = false) {
  try {
    const tools = await db
      .select()
      .from(toolsTable)
      .where(includeHidden ? undefined : eq(toolsTable.isHidden, false))
      .orderBy(desc(toolsTable.createdAt));
    return { success: true, data: tools };
  } catch (error) {
    console.error("获取工具列表失败:", error);
    return { success: false, error: "获取工具列表失败" };
  }
}

/**
 * Server Action: 创建工具
 */
export async function createTool(data: {
  name: string;
  description?: string | null;
  coverImage?: string | null;
  url: string;
  isHidden?: boolean;
}) {
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: "未登录" };
  }

  try {
    const result = await db
      .insert(toolsTable)
      .values({
        name: data.name,
        description: data.description || null,
        coverImage: data.coverImage || null,
        url: data.url,
        isHidden: data.isHidden || false,
      })
      .returning();

    return { success: true, data: result[0] };
  } catch (error) {
    console.error("创建工具失败:", error);
    return { success: false, error: "创建工具失败" };
  }
}

/**
 * Server Action: 更新工具
 */
export async function updateTool(
  id: number,
  data: {
    name?: string;
    description?: string | null;
    coverImage?: string | null;
    url?: string;
    isHidden?: boolean;
  }
) {
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: "未登录" };
  }

  try {
    const updateData: {
      name?: string;
      description?: string | null;
      coverImage?: string | null;
      url?: string;
      isHidden?: boolean;
      updatedAt?: Date;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.isHidden !== undefined) updateData.isHidden = data.isHidden;
    updateData.updatedAt = new Date();

    const result = await db
      .update(toolsTable)
      .set(updateData)
      .where(eq(toolsTable.id, id))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "工具不存在" };
    }

    return { success: true, data: result[0] };
  } catch (error) {
    console.error("更新工具失败:", error);
    return { success: false, error: "更新工具失败" };
  }
}

/**
 * Server Action: 删除工具
 */
export async function deleteTool(id: number) {
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: "未登录" };
  }

  try {
    const result = await db
      .delete(toolsTable)
      .where(eq(toolsTable.id, id))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "工具不存在" };
    }

    return { success: true };
  } catch (error) {
    console.error("删除工具失败:", error);
    return { success: false, error: "删除工具失败" };
  }
}

