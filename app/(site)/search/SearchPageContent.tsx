import Link from 'next/link';
import type { SiteLocale } from '@/lib/site-locale';
import { pathWithLocale } from '@/lib/site-locale';
import { searchPosts } from '@/server/actions/posts';
import { SearchForm } from '@/components/site/SearchForm';

type SearchPageContentProps = {
  locale: SiteLocale;
  query: string;
};

/**
 * 搜索结果内容（中英共用）
 */
export async function SearchPageContent({ locale, query }: SearchPageContentProps) {
  const result = query ? await searchPosts(query) : { success: true as const, data: [] };
  const posts = result.success && result.data ? result.data : [];
  const error = result.success ? null : result.error;

  const labels =
    locale === 'en'
      ? {
          back: '← Home',
          title: 'Search',
          hint: 'Enter keywords to search',
          none: (q: string) => `No results for "${q}"`,
          count: (n: number, q: string) => `${n} result(s) for "${q}"`,
        }
      : {
          back: '← 返回首页',
          title: '搜索文章',
          hint: '输入关键词开始搜索',
          none: (q: string) => `未找到与「${q}」相关的文章`,
          count: (n: number, q: string) => `共 ${n} 条结果（关键词：${q}）`,
        };

  return (
    <div className="retro-content max-w-3xl">
      <Link
        href={pathWithLocale('/', locale)}
        className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
      >
        {labels.back}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-4">{labels.title}</h1>
      <SearchForm locale={locale} defaultQuery={query} className="mb-8" />

      {!query && <p className="text-sm text-muted-foreground text-center py-8">{labels.hint}</p>}

      {query && error && <p className="text-sm text-destructive text-center py-8">{error}</p>}

      {query && !error && posts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">{labels.none(query)}</p>
      )}

      {query && !error && posts.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{labels.count(posts.length, query)}</p>
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-lg border border-border/80 bg-card p-4 shadow-sm hover:border-border motion-safe:transition-colors"
            >
              <div className="flex items-start gap-2 mb-2">
                <Link
                  href={pathWithLocale(`/blog/${post.id}`, locale)}
                  className="flex-1 text-lg font-semibold hover:text-muted-foreground motion-safe:transition-colors"
                >
                  {post.title}
                </Link>
                {post.isPinned && (
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
                    {locale === 'en' ? 'Pinned' : '置顶'}
                  </span>
                )}
              </div>
              {post.snippet && (
                <p
                  className="text-sm text-muted-foreground mb-2 line-clamp-3 [&_mark]:bg-amber-100 [&_mark]:text-foreground dark:[&_mark]:bg-amber-900/50 [&_mark]:rounded px-0.5"
                  dangerouslySetInnerHTML={{ __html: post.snippet }}
                />
              )}
              {post.createdAt && (
                <time
                  dateTime={new Date(post.createdAt).toISOString()}
                  className="text-xs text-muted-foreground"
                >
                  {new Date(post.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
