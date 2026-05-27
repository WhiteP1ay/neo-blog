'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { BlogPostListCard } from '@/components/blog/BlogPostListCard';
import { Button } from '@/components/ui/button';
import { useIsAdmin } from '@/hooks/admin/useIsAdmin';
import type { HomeFeaturedPost } from '@/server/types/explorer';
import { useSiteLocale } from '@/components/site/SiteLocaleProvider';
import { pathWithLocale } from '@/lib/site-locale';

type HomeFeaturedProps = {
  posts: HomeFeaturedPost[];
};

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
          <BlogPostListCard key={post.id} post={post} />
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
