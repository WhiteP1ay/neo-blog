import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/server/actions/posts";

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

/**
 * 首页 - 文章列表
 */
export default async function Home() {
  const result = await getPosts();
  const posts = result.success && result.data ? result.data : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <header className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Blog</h1>
          <p className="text-gray-600 text-sm sm:text-base">文章列表</p>
        </header>

        {posts.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            暂无文章
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6"
              >
                <Link href={`/${post.id}`}>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3 hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                </Link>
                {post.createdAt && (
                  <div className="text-xs sm:text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
