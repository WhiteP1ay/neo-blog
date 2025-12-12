"use server";

import { db } from "@/server/db/db";
import { analyticsTable } from "@/server/db/schema";
import { desc, eq, gte, and, sql } from "drizzle-orm";
import { getSession } from "@/server/utils/auth";

/**
 * 埋点数据类型定义
 */
export type Analytics = {
  id: number;
  type: string;
  action: string | null;
  target: string | null;
  url: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: Date;
};

/**
 * Server Action: 创建埋点记录
 */
export async function createAnalytics(data: {
  type: string;
  action?: string;
  target?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const result = await db
      .insert(analyticsTable)
      .values({
        type: data.type,
        action: data.action || null,
        target: data.target || null,
        url: data.url || null,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      })
      .returning();

    return { success: true, data: result[0] };
  } catch (error) {
    console.error("创建埋点记录失败:", error);
    return { success: false, error: "创建埋点记录失败" };
  }
}

/**
 * Server Action: 获取埋点统计数据（用于admin管理）
 */
export async function getAnalyticsStats(days: number = 7) {
  // 检查登录状态
  const userId = await getSession();
  if (!userId) {
    return { success: false, error: "未登录" };
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取指定时间范围内的所有埋点数据
    const analytics = await db
      .select()
      .from(analyticsTable)
      .where(gte(analyticsTable.createdAt, startDate))
      .orderBy(desc(analyticsTable.createdAt));

    // 按日期分组统计
    const dailyStats: Record<string, { date: string; pageViews: number; comments: number; clicks: number }> = {};
    
    analytics.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString("zh-CN");
      if (!dailyStats[date]) {
        dailyStats[date] = { date, pageViews: 0, comments: 0, clicks: 0 };
      }

      if (item.type === "page_view") {
        dailyStats[date].pageViews++;
      } else if (item.type === "comment") {
        dailyStats[date].comments++;
      } else if (item.action?.includes("click")) {
        dailyStats[date].clicks++;
      }
    });

    // 按类型统计
    const typeStats: Record<string, number> = {};
    analytics.forEach((item) => {
      typeStats[item.type] = (typeStats[item.type] || 0) + 1;
    });

    // 按操作统计
    const actionStats: Record<string, number> = {};
    analytics.forEach((item) => {
      if (item.action) {
        actionStats[item.action] = (actionStats[item.action] || 0) + 1;
      }
    });

    // 最受欢迎的文章（按page_view统计）
    const postViews: Record<string, number> = {};
    analytics.forEach((item) => {
      if (item.type === "page_view" && item.target) {
        postViews[item.target] = (postViews[item.target] || 0) + 1;
      }
    });

    const topPosts = Object.entries(postViews)
      .map(([target, count]) => ({ target, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      success: true,
      data: {
        total: analytics.length,
        dailyStats: Object.values(dailyStats).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
        typeStats,
        actionStats,
        topPosts,
        recent: analytics.slice(0, 100), // 最近100条记录
      },
    };
  } catch (error) {
    console.error("获取埋点统计失败:", error);
    return { success: false, error: "获取埋点统计失败" };
  }
}

