import type { Metadata } from "next";
import Link from "next/link";
import { searchPosts } from "@/server/actions/posts";
import { SearchForm } from "@/app/components/SearchForm";

export const metadata: Metadata = {
  title: "搜索",
  description: "搜索 White Meta 博客文章",
  robots: { index: false, follow: true },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

/**
 * 搜索结果页
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const result = query
    ? await searchPosts(query)
    : { success: true as const, data: [] };
  const posts = result.success && result.data ? result.data : [];
  const error = result.success ? null : result.error;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <header className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block"
          >
            ← 返回首页
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            搜索文章
          </h1>
          <SearchForm defaultQuery={query} />
        </header>

        {!query && (
          <p className="text-gray-500 text-center py-8">输入关键词开始搜索</p>
        )}

        {query && error && (
          <p className="text-red-600 text-center py-8">{error}</p>
        )}

        {query && !error && posts.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            未找到与「{query}」相关的文章
          </p>
        )}

        {query && !error && posts.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            <p className="text-sm text-gray-500">
              共 {posts.length} 条结果（关键词：{query}）
            </p>
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Link href={`/${post.id}`} className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                  </Link>
                  {post.isPinned && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                      📌 置顶
                    </span>
                  )}
                </div>
                {post.snippet && (
                  <p
                    className="text-sm text-gray-600 mb-2 line-clamp-3 [&_mark]:bg-yellow-100 [&_mark]:text-gray-900 [&_mark]:rounded px-0.5"
                    dangerouslySetInnerHTML={{ __html: post.snippet }}
                  />
                )}
                {post.createdAt && (
                  <div className="text-xs text-gray-500">
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
