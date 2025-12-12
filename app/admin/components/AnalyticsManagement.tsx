"use client";

import { getAnalyticsStats } from "@/server/actions/analytics";
import { useState, useEffect, useCallback } from "react";

interface AnalyticsManagementProps {
  days: number;
  onDaysChange: (days: number) => void;
}

/**
 * 每日统计数据
 */
interface DailyStat {
  date: string;
  pageViews: number;
  comments: number;
  clicks: number;
}

/**
 * 热门文章
 */
interface TopPost {
  target: string;
  count: number;
}

/**
 * 埋点统计数据
 */
interface AnalyticsData {
  total: number;
  dailyStats: DailyStat[];
  typeStats: Record<string, number>;
  actionStats: Record<string, number>;
  topPosts: TopPost[];
  recent: unknown[];
}

/**
 * 埋点统计管理组件
 */
export function AnalyticsManagement({ days, onDaysChange }: AnalyticsManagementProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await getAnalyticsStats(days);
    if (result.success && result.data) {
      setData(result.data);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">暂无数据</div>;
  }

  return (
    <div className="space-y-8">
      {/* 时间范围选择 */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">统计时间范围：</label>
        <select
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>最近7天</option>
          <option value={30}>最近30天</option>
          <option value={90}>最近90天</option>
        </select>
      </div>

      {/* 总览统计 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">总览</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.total}</div>
            <div className="text-sm text-gray-600">总事件数</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data.dailyStats.reduce((sum: number, d: DailyStat) => sum + d.pageViews, 0)}
            </div>
            <div className="text-sm text-gray-600">总页面浏览</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {data.dailyStats.reduce((sum: number, d: DailyStat) => sum + d.comments, 0)}
            </div>
            <div className="text-sm text-gray-600">总评论数</div>
          </div>
        </div>
      </div>

      {/* 每日统计表格 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">每日统计</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                日期
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                页面浏览
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                评论
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                点击
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.dailyStats.map((stat: DailyStat, index: number) => (
              <tr key={index}>
                <td className="px-6 py-4 text-sm text-gray-900">{stat.date}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{stat.pageViews}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{stat.comments}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{stat.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 事件类型统计 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">事件类型统计</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                事件类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                数量
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(data.typeStats).map(([type, count]) => (
              <tr key={type}>
                <td className="px-6 py-4 text-sm text-gray-900">{type}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{count as number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 操作统计 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">操作统计</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                操作
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                数量
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(data.actionStats).map(([action, count]) => (
              <tr key={action}>
                <td className="px-6 py-4 text-sm text-gray-900">{action}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{count as number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 热门文章 */}
      {data.topPosts && data.topPosts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">热门文章</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  文章ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  浏览次数
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.topPosts.map((post: TopPost) => (
                <tr key={post.target}>
                  <td className="px-6 py-4 text-sm">
                    <a
                      href={`/${post.target.replace("post_", "")}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {post.target}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{post.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

