import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPosts, getAllTypes } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Blog',
  description: '全部文章',
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const typeFilter = typeof sp.type === 'string' ? sp.type : undefined;

  const allPosts = getAllPosts();
  const filteredPosts = typeFilter ? allPosts.filter((p) => p.types?.includes(typeFilter)) : allPosts;
  const types = getAllTypes();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">📝 Blog Posts</h1>
      </div>

      {/* Type filter */}
      {types.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`tag-pill ${!typeFilter ? 'bg-primary text-primary-foreground hover:brightness-95' : ''}`}
          >
            全部
          </Link>
          {types.map((type) => (
            <Link
              key={type}
              href={`/blog?type=${encodeURIComponent(type)}`}
              className={`tag-pill ${typeFilter === type ? 'bg-primary text-primary-foreground hover:brightness-95' : ''}`}
            >
              {type}
            </Link>
          ))}
        </div>
      )}

      {typeFilter && (
        <p className="mb-6 text-sm text-muted-foreground">
          筛选：{typeFilter}
          {' · '}
          <Link href="/blog" className="text-primary hover:underline">
            清除筛选
          </Link>
        </p>
      )}

      {/* Post list */}
      {filteredPosts.length === 0 ? (
        <p className="text-sm text-muted-foreground">这个分类下还没有文章。</p>
      ) : (
        <div className="divide-y divide-border">
          {filteredPosts.map((post) => (
            <article key={post.slug} className="py-7 first:pt-0 last:pb-0">
              <Link href={`/blog/${post.slug}`} className="group block">
                <h2 className="text-lg font-semibold text-foreground transition-colors duration-150 group-hover:text-primary">
                  {post.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {post.date && <time>{post.date}</time>}
                  {post.types?.map((t) => (
                    <span key={t} className="tag-pill">
                      {t}
                    </span>
                  ))}
                  {post.tags?.map((tag) => (
                    <span key={tag} className="text-xs text-muted-foreground/80">
                      #{tag}
                    </span>
                  ))}
                </div>
                {post.excerpt && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>}
                <span className="mt-2 inline-block text-sm font-medium text-primary group-hover:underline">
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
