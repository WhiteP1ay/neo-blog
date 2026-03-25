'use server';

import { db } from '@/server/db/db';
import { analyticsTable } from '@/server/db/schema';
import { desc, gte } from 'drizzle-orm';
import { headers } from 'next/headers';
import { getSession, requireAdminSession } from '@/server/utils/auth';
import { getClientIP } from '@/server/utils/get-client-ip';
import { parseUserAgent } from '@/server/utils/userAgent';
import { actionErr, actionOk, actionOkVoid } from '@/server/types/action-result';
import type { ActionResult, ActionVoidResult } from '@/server/types/action-result';
import type { AnalyticsStatsPayload } from '@/server/types/analytics-payload';
import type { Analytics } from '@/server/types/models';

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
  metadata?: Record<string, unknown>;
}): Promise<ActionResult<Analytics>> {
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

    return actionOk(result[0]);
  } catch (error) {
    console.error('创建埋点记录失败:', error);
    return actionErr('创建埋点记录失败');
  }
}

/**
 * 客户端埋点入口：解析 IP / UA、合并 metadata 后写入库；失败时静默成功，不打断用户操作。
 */
export async function ingestAnalyticsEvent(input: {
  type: string;
  action?: string;
  target?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<ActionVoidResult> {
  try {
    const h = await headers();
    const clientIP = getClientIP(h);
    const rawUserAgent = input.userAgent || h.get('user-agent') || '';
    const parsedUA = parseUserAgent(rawUserAgent);

    const metadata = {
      ...input.metadata,
      userAgentRaw: rawUserAgent,
      userAgentParsed: {
        device: parsedUA.device,
        browser: parsedUA.browser,
        os: parsedUA.os,
        isWeChat: parsedUA.isWeChat,
      },
    };

    const result = await createAnalytics({
      type: input.type,
      action: input.action,
      target: input.target,
      url: input.url,
      ip: clientIP,
      userAgent: parsedUA.readable,
      metadata,
    });

    if (!result.success) {
      console.error('埋点存储失败:', result.error);
    }

    return actionOkVoid();
  } catch (error) {
    console.error('Analytics error:', error);
    return actionOkVoid();
  }
}

/**
 * Server Action: 获取埋点统计数据（用于admin管理）
 */
export async function getAnalyticsStats(days: number = 7): Promise<ActionResult<AnalyticsStatsPayload>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await db
      .select()
      .from(analyticsTable)
      .where(gte(analyticsTable.createdAt, startDate))
      .orderBy(desc(analyticsTable.createdAt));

    const dailyStats: Record<
      string,
      {
        date: string;
        pageViews: number;
        uniqueVisitors: Set<string>;
        comments: number;
        clicks: number;
      }
    > = {};

    analytics.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString('zh-CN');
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          pageViews: 0,
          uniqueVisitors: new Set<string>(),
          comments: 0,
          clicks: 0,
        };
      }

      if (item.type === 'page_view') {
        dailyStats[date].pageViews++;
        if (item.ip && item.userAgent) {
          const visitorKey = `${item.ip}_${item.userAgent}`;
          dailyStats[date].uniqueVisitors.add(visitorKey);
        }
      } else if (item.type === 'comment') {
        dailyStats[date].comments++;
      } else if (item.action?.includes('click')) {
        dailyStats[date].clicks++;
      }
    });

    const dailyStatsArray = Object.values(dailyStats).map((stat) => ({
      date: stat.date,
      pageViews: stat.pageViews,
      uniqueVisitors: stat.uniqueVisitors.size,
      comments: stat.comments,
      clicks: stat.clicks,
    }));

    const typeStats: Record<string, number> = {};
    analytics.forEach((item) => {
      typeStats[item.type] = (typeStats[item.type] || 0) + 1;
    });

    const actionStats: Record<string, number> = {};
    analytics.forEach((item) => {
      if (item.action) {
        actionStats[item.action] = (actionStats[item.action] || 0) + 1;
      }
    });

    const postViews: Record<string, number> = {};
    analytics.forEach((item) => {
      if (item.type === 'page_view' && item.target) {
        postViews[item.target] = (postViews[item.target] || 0) + 1;
      }
    });

    const topPosts = Object.entries(postViews)
      .map(([target, count]) => ({ target, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalPV = dailyStatsArray.reduce((sum, stat) => sum + stat.pageViews, 0);
    const allUniqueVisitors = new Set<string>();
    analytics.forEach((item) => {
      if (item.type === 'page_view' && item.ip && item.userAgent) {
        const visitorKey = `${item.ip}_${item.userAgent}`;
        allUniqueVisitors.add(visitorKey);
      }
    });
    const totalUV = allUniqueVisitors.size;

    return actionOk({
      total: analytics.length,
      totalPV,
      totalUV,
      dailyStats: dailyStatsArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      typeStats,
      actionStats,
      topPosts,
      recent: analytics.slice(0, 100),
    });
  } catch (error) {
    console.error('获取埋点统计失败:', error);
    return actionErr('获取埋点统计失败');
  }
}
