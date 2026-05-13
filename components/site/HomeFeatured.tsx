'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AdminPostEditEntry } from '@/components/admin/AdminPostEditEntry';
import { Button } from '@/components/ui/button';
import { useIsAdmin } from '@/hooks/admin/useIsAdmin';
import type { HomeFeaturedPost } from '@/server/types/explorer';
import { useSiteLocale } from '@/components/site/SiteLocaleProvider';
import { pathWithLocale } from '@/lib/site-locale';
import { featuredExcerpt, featuredListTitle } from '@/lib/post-display-i18n';

type HomeFeaturedProps = {
  posts: HomeFeaturedPost[];
};

function formatDate(value: Date | string | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 首页精选区：管理员手动挑选的 5 篇文章卡片 + 「查看更多文章」CTA。
 * 设计参考 ui-ux-pro-max：Minimal Single Column + 清晰栅格 + 单一 CTA。
 */
export function HomeFeatured({ posts }: HomeFeaturedProps) {
  const isAdmin = useIsAdmin();
  const { locale } = useSiteLocale();
  const isEn = locale === 'en';

  if (posts.length === 0) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? isEn
              ? 'No featured posts yet. Configure them in '
              : '尚未配置首页精选，请前往 '
            : isEn
              ? 'No featured posts yet. '
              : '暂无精选文章，'}
          {isAdmin ? (
            <Link
              href="/admin/home"
              className="cursor-pointer rounded-md px-1 py-0.5 text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            >
              {isEn ? 'Admin → Home featured' : '后台首页精选'}
            </Link>
          ) : null}
          {isAdmin ? (isEn ? '.' : ' 配置。') : isEn ? 'Browse all posts below.' : '欢迎从下方查看全部文章。'}
        </p>
        <div className="flex justify-center">
          <Button asChild variant="outline" size="lg" className="cursor-pointer">
            <Link href={pathWithLocale('/blog', locale)}>
              {isEn ? 'All posts' : '查看全部文章'}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <ul className="grid grid-cols-1 gap-3 sm:gap-4">
        {posts.map((post) => (
          <li
            key={post.id}
            className="group relative overflow-hidden rounded-xl border border-border bg-card motion-safe:transition-colors motion-safe:duration-200 hover:border-foreground/30 hover:bg-accent/40"
          >
            <Link
              href={pathWithLocale(`/blog/${post.id}`, locale)}
              className="block px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background sm:px-5 sm:py-5 cursor-pointer"
            >
              <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {featuredListTitle(post, locale)}
              </h3>
              {featuredExcerpt(post, locale) ? (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {featuredExcerpt(post, locale)}
                </p>
              ) : null}
              {post.createdAt ? (
                <time className="mt-3 block text-xs tabular-nums text-muted-foreground">
                  {formatDate(post.createdAt)}
                </time>
              ) : null}
            </Link>
            {isAdmin ? (
              <div className="pointer-events-none absolute right-3 top-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
                <div className="pointer-events-auto">
                  <AdminPostEditEntry postId={post.id} />
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex justify-center pt-2">
        <Button asChild variant="outline" size="lg" className="cursor-pointer">
          <Link href={pathWithLocale('/blog', locale)}>
            {isEn ? 'More posts' : '查看更多文章'}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
