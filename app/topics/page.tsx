import type { Metadata } from "next";
import Image from "next/image";
import { getTopics } from "@/server/actions/topics";
import { BackToHome } from "@/app/components/BackToHome";
import Link from "next/link";

export const metadata: Metadata = {
  title: "专题",
  description: "White Meta 博客 - 专题列表",
};

export const revalidate = 60;

/**
 * 专题列表页面（方块排列）
 */
export default async function TopicsPage() {
  const result = await getTopics(false); // 不包含隐藏的专题
  const topics = result.success && result.data ? result.data : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <header className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">专题</h1>
            <BackToHome />
          </div>
        </header>

        {topics.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            暂无专题
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topics/${topic.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                {topic.coverImage ? (
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={topic.coverImage}
                      alt={topic.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-linear-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-gray-400"
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
                  </div>
                )}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {topic.name}
                    </h2>
                    {topic.isPinned && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap ml-2">
                        📌 置顶
                      </span>
                    )}
                  </div>
                  {topic.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 mt-2">
                      {topic.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-4">
                    {new Date(topic.createdAt).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

