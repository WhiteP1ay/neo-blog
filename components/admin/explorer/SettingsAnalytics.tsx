'use client';

/**
 * 设置弹窗内：埋点统计（仅管理员 session 下可见，数据由 getAnalyticsStats 校验登录）。
 */

import { useCallback, useEffect, useState } from 'react';
import { getAnalyticsStats } from '@/server/actions/analytics';
import type { AnalyticsStatsPayload } from '@/server/types/analytics-payload';

export function SettingsAnalytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AnalyticsStatsPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await getAnalyticsStats(days);
    if (result.success) {
      setData(result.data);
    } else {
      setData(null);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">访问统计</h3>
        <label className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="sr-only">统计时间范围</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border-input bg-background text-foreground rounded-md border px-2 py-1 text-xs"
          >
            <option value={7}>最近 7 天</option>
            <option value={30}>最近 30 天</option>
            <option value={90}>最近 90 天</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-4 text-center text-sm">加载中…</p>
      ) : !data ? (
        <p className="text-muted-foreground py-4 text-center text-sm">暂无数据或未登录</p>
      ) : (
        <div className="space-y-4">
          <div className="bg-muted/40 grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-foreground text-lg font-semibold">{data.total}</div>
              <div className="text-muted-foreground text-[11px]">总事件</div>
            </div>
            <div className="text-center">
              <div className="text-foreground text-lg font-semibold">{data.totalPV || 0}</div>
              <div className="text-muted-foreground text-[11px]">PV</div>
            </div>
            <div className="text-center">
              <div className="text-foreground text-lg font-semibold">{data.totalUV || 0}</div>
              <div className="text-muted-foreground text-[11px]">UV</div>
            </div>
            <div className="text-center">
              <div className="text-foreground text-lg font-semibold">{data.dailyStats.reduce((sum, d) => sum + d.comments, 0)}</div>
              <div className="text-muted-foreground text-[11px]">评论</div>
            </div>
          </div>

          <div className="max-h-48 overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-muted-foreground px-2 py-2 font-medium">日期</th>
                  <th className="text-muted-foreground px-2 py-2 font-medium">PV</th>
                  <th className="text-muted-foreground px-2 py-2 font-medium">UV</th>
                  <th className="text-muted-foreground px-2 py-2 font-medium">评</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyStats.map((stat) => (
                  <tr key={stat.date} className="border-t border-border">
                    <td className="text-foreground px-2 py-1.5">{stat.date}</td>
                    <td className="text-muted-foreground px-2 py-1.5">{stat.pageViews}</td>
                    <td className="text-muted-foreground px-2 py-1.5">{stat.uniqueVisitors || 0}</td>
                    <td className="text-muted-foreground px-2 py-1.5">{stat.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.topPosts && data.topPosts.length > 0 ? (
            <div className="max-h-36 overflow-auto rounded-lg border border-border">
              <div className="text-muted-foreground border-b border-border bg-muted/40 px-2 py-1.5 text-[11px] font-medium">
                热门文章
              </div>
              <table className="w-full text-left text-xs">
                <tbody>
                  {data.topPosts.map((post) => (
                    <tr key={post.target} className="border-t border-border">
                      <td className="text-foreground px-2 py-1.5">{post.target}</td>
                      <td className="text-muted-foreground px-2 py-1.5">{post.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

