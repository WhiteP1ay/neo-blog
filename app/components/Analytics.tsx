"use client";

import { useEffect } from "react";

/**
 * 埋点事件类型
 */
export type AnalyticsEvent = {
  type: string; // 事件类型：page_view, click, submit, etc.
  action?: string; // 具体操作：view_post, submit_comment, etc.
  target?: string; // 目标：post_id, button_name, etc.
  metadata?: Record<string, unknown>; // 额外数据
};

/**
 * 发送埋点数据
 */
async function trackEvent(event: AnalyticsEvent) {
  try {
    // 发送到埋点API
    await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error("Analytics error:", error);
  }
}

/**
 * 埋点Hook
 */
export function useAnalytics() {
  /**
   * 追踪事件
   */
  const track = (event: AnalyticsEvent) => {
    // 使用 requestIdleCallback 或 setTimeout 异步发送，不阻塞主线程
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      requestIdleCallback(() => trackEvent(event), { timeout: 2000 });
    } else {
      setTimeout(() => trackEvent(event), 0);
    }
  };

  return { track };
}

/**
 * 页面浏览埋点
 */
export function usePageView(pageId?: string) {
  useEffect(() => {
    trackEvent({
      type: "page_view",
      action: "view_page",
      target: pageId || (typeof window !== "undefined" ? window.location.pathname : ""),
    });
  }, [pageId]); // 只在 pageId 变化时触发
}

