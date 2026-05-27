'use client';

import { BlogPostNavLink } from '@/components/blog/BlogPostNavLink';
import { AdminPostEditEntry } from '@/components/admin/AdminPostEditEntry';
import { useIsAdmin } from '@/hooks/admin/useIsAdmin';
import type { BlogPostCardPreview } from '@/server/types/explorer';
import { useSiteLocale } from '@/components/site/SiteLocaleProvider';
import { pathWithLocale } from '@/lib/site-locale';
import { featuredExcerpt, featuredListTitle } from '@/lib/post-display-i18n';

export type BlogPostListCardProps = {
  post: BlogPostCardPreview;
};

/**
 * 首页精选与 /blog 列表共用的博文卡片（标题 + 可选摘要 + 管理员快捷编辑）。
 */
export function BlogPostListCard({ post }: BlogPostListCardProps) {
  const isAdmin = useIsAdmin();
  const { locale } = useSiteLocale();
  const excerpt = featuredExcerpt(post, locale);

  return (
    <li className="group relative overflow-hidden rounded-xl border border-border bg-card motion-safe:transition-colors motion-safe:duration-200 hover:border-foreground/30 hover:bg-accent/40">
      <BlogPostNavLink
        href={pathWithLocale(`/blog/${post.id}`, locale)}
        className="block px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background sm:px-5 sm:py-5 cursor-pointer"
        innerClassName="block"
      >
        <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {featuredListTitle(post, locale)}
        </h3>
        {excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{excerpt}</p> : null}
      </BlogPostNavLink>
      {isAdmin ? (
        <div className="pointer-events-none absolute right-3 top-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
          <div className="pointer-events-auto">
            <AdminPostEditEntry postId={post.id} />
          </div>
        </div>
      ) : null}
    </li>
  );
}
