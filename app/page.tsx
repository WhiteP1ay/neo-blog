import type { Metadata } from "next";
import { getMixedList, type ListItem } from "@/server/actions/posts";
import { TopicItem } from "@/app/components/TopicItem";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { FeatureCard } from "@/app/components/FeatureCard";
import { PostCard } from "@/app/components/PostCard";
import { PageHeader } from "@/app/components/PageHeader";
import { WeChatSidebar } from "@/app/components/WeChatSidebar";

export const metadata: Metadata = {
  title: "首页",
  description: "White Meta 博客 - 技术文章和编程分享",
  keywords: ["博客", "技术文章", "编程", "开发"],
  openGraph: {
    title: "White Meta 博客",
    description: "技术文章和编程分享",
    type: "website",
  },
};

export const revalidate = 60;

/**
 * 首页 - 文章列表（支持专题）
 */
export default async function Home() {
  // 默认显示专题，可以通过查询参数控制
  const result = await getMixedList(true);
  const items: ListItem[] = result.success && result.data ? result.data : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex gap-8">
          {/* 主内容区域 */}
          <div className="flex-1 min-w-0">
            <Breadcrumb />
            <PageHeader
              title="White Meta"
              avatar={{ src: "/avatar1.jpg", alt: "白玩dev" }}
              authorLink={{ href: "/me", label: "白玩dev" }}
            />

            {/* 专题和工具入口 */}
            <div className="mb-8 sm:mb-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FeatureCard
                href="/topics"
                icon={
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                }
                title="专题"
                description="有的事得用一系列文章才能说明白"
              />
              <FeatureCard
                href="/tools"
                icon={
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
                title="工具"
                description="一些我开发的小工具"
              />
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                暂无内容
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {items.map((item) => {
                  if (item.type === "topic") {
                    return <TopicItem key={`topic-${item.data.id}`} topic={item.data} />;
                  } else {
                    return <PostCard key={`post-${item.data.id}`} post={item.data} />;
                  }
                })}
              </div>
            )}
          </div>

          {/* 右侧 Sticky 侧边栏 */}
          <WeChatSidebar />
        </div>
      </div>
    </div>
  );
}
