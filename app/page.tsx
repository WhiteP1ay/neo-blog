import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/server/actions/posts";
import { SearchForm } from "@/app/components/SearchForm";
import Image from "next/image";

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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              White Meta
            </h1>
            <div className="flex items-center gap-2">
              <Image
                className="rounded-full"
                src="/avatar1.jpg"
                alt="Ethan Park"
                width={32}
                height={32}
              />
              <Link href="/me">By Ethan Park</Link>
            </div>
          </div>
          <SearchForm />
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
                <div className="flex items-start gap-2 mb-2 sm:mb-3">
                  <Link href={`/${post.id}`} className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                  </Link>
                  {post.isPinned && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                      📌 置顶
                    </span>
                  )}
                </div>
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
