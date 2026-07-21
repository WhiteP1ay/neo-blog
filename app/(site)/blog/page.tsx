import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, getAllTypes } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "全部文章",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const typeFilter = typeof sp.type === "string" ? sp.type : undefined;

  const allPosts = getAllPosts();
  const filteredPosts = typeFilter
    ? allPosts.filter((p) => p.types?.includes(typeFilter))
    : allPosts;
  const types = getAllTypes();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          📝 Blog Posts
        </h1>
      </div>

      {/* Type filter */}
      {types.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`tag-pill ${!typeFilter ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
          >
            全部
          </Link>
          {types.map((type) => (
            <Link
              key={type}
              href={`/blog?type=${encodeURIComponent(type)}`}
              className={`tag-pill ${typeFilter === type ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
            >
              {type}
            </Link>
          ))}
        </div>
      )}

      {typeFilter && (
        <p className="mb-6 text-sm text-slate-500">
          筛选：{typeFilter}
          {" · "}
          <Link href="/blog" className="text-blue-600 hover:underline">
            清除筛选
          </Link>
        </p>
      )}

      {/* Post list */}
      {filteredPosts.length === 0 ? (
        <p className="text-sm text-slate-500">这个分类下还没有文章。</p>
      ) : (
        <div className="divide-y divide-slate-200">
          {filteredPosts.map((post) => (
            <article key={post.slug} className="py-7 first:pt-0 last:pb-0">
              <Link href={`/blog/${post.slug}`} className="group block">
                <h2 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                  {post.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {post.date && <time>{post.date}</time>}
                  {post.types?.map((t) => (
                    <span key={t} className="tag-pill">{t}</span>
                  ))}
                  {post.tags?.map((tag) => (
                    <span key={tag} className="text-xs text-slate-400">
                      #{tag}
                    </span>
                  ))}
                </div>
                {post.excerpt && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-2 inline-block text-sm font-medium text-blue-600 group-hover:underline">
                  Read more →
                </span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
