import type { Analytics } from '@/server/types/models';

export type AnalyticsStatsPayload = {
  total: number;
  totalPV: number;
  totalUV: number;
  dailyStats: Array<{
    date: string;
    pageViews: number;
    uniqueVisitors: number;
    comments: number;
    clicks: number;
  }>;
  typeStats: Record<string, number>;
  actionStats: Record<string, number>;
  topPosts: Array<{ target: string; count: number }>;
  recent: Analytics[];
};
