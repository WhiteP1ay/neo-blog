"use client";

import { useState, useEffect, useCallback } from "react";
import { getPosts, type Post } from "@/server/actions/posts";
import { PostsManagement } from "./components/PostsManagement";
import { TopicsManagement } from "./components/TopicsManagement";
import { ToolsManagement } from "./components/ToolsManagement";
import { AnalyticsManagement } from "./components/AnalyticsManagement";
import { Tabs } from "./components/Tabs";
import { BackToHome } from "@/app/components/BackToHome";

type TabType = "posts" | "topics" | "tools" | "analytics";

/**
 * Admin管理页面 - 纯客户端组件
 */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(7);

  /**
   * 加载文章列表
   */
  const loadPosts = useCallback(async () => {
    setLoading(true);
    const result = await getPosts();
    if (result.success && result.data) {
      setPosts(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "posts") {
      loadPosts();
    }
  }, [activeTab, loadPosts]);

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: "posts", label: "文章管理" },
    { id: "topics", label: "专题管理" },
    { id: "tools", label: "工具管理" },
    { id: "analytics", label: "埋点统计" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-4 sm:mb-8">
          <BackToHome className="text-sm sm:text-base text-blue-600 hover:text-blue-800" showIcon={false} />
        </div>

        <Tabs<TabType> activeTab={activeTab} tabs={tabs} onTabChange={setActiveTab} />

        {activeTab === "posts" && (
          <PostsManagement posts={posts} loading={loading} onRefresh={loadPosts} />
        )}

        {activeTab === "topics" && <TopicsManagement />}

        {activeTab === "tools" && <ToolsManagement />}

        {activeTab === "analytics" && (
          <AnalyticsManagement
            days={analyticsDays}
            onDaysChange={setAnalyticsDays}
          />
        )}
      </div>
    </div>
  );
}
