import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = getPostBySlug(id);
  if (!post) return { title: "404 | White Meta" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPostBySlug(id);

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Back link */}
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-blue-600"
      >
        ← 返回文章列表
      </Link>

      <article>
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {post.date && <time>{post.date}</time>}
            {post.type && <span className="tag-pill">{post.type}</span>}
            {post.tags?.map((tag) => (
              <span key={tag} className="text-xs text-slate-400">
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* Content */}
        <div
          className="article-prose"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>

      {/* Footer nav */}
      <div className="mt-16 border-t border-slate-200 pt-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-blue-600"
        >
          ← 返回文章列表
        </Link>
      </div>
    </div>
  );
}
