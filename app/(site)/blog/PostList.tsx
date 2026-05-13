'use client';

import { useMemo } from 'react';
import type { HomeExplorerCategory, HomeExplorerPostPreview } from '@/server/types/explorer';
import Link from 'next/link';
import { AdminPostEditEntry } from '@/components/admin/AdminPostEditEntry';
import { Button } from '@/components/ui/button';
import { useIsAdmin } from '@/hooks/admin/useIsAdmin';
import { cn } from '@/lib/utils';
import { useSiteLocale } from '@/components/site/SiteLocaleProvider';
import { pathWithLocale } from '@/lib/site-locale';
import { postListTitle } from '@/lib/post-display-i18n';
import { publicBlogListPath } from '@/lib/blog-list-query';

interface PostListProps {
  categories: HomeExplorerCategory[];
  /**
   * 当前 URL 对应的类型码；与 {@link HomeExplorerCategory.typeCode} 一致（含空串=未分类桶）。
   */
  selectedTypeCode: string;
}

export function PostList({ categories, selectedTypeCode }: PostListProps) {
  const isAdmin = useIsAdmin();
  const { locale } = useSiteLocale();
  const posts = useMemo<HomeExplorerPostPreview[]>(() => {
    const activeCategory = categories.find((category) => category.typeCode === selectedTypeCode);
    return activeCategory?.posts ?? [];
  }, [selectedTypeCode, categories]);

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2" aria-label="专题筛选">
        {categories.map((category) => {
          const selected = selectedTypeCode === category.typeCode;
          return (
            <Button
              key={category.typeCode === '' ? '__uncat' : category.typeCode}
              variant={selected ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 rounded-full px-3 text-xs font-normal shadow-none motion-safe:transition-colors motion-safe:duration-200',
              )}
              asChild
            >
              <Link
                href={pathWithLocale(publicBlogListPath(category.typeCode), locale)}
                scroll={false}
                aria-current={selected ? 'page' : undefined}
              >
                {category.name}
              </Link>
            </Button>
          );
        })}
      </nav>
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{locale === 'en' ? 'No posts in this topic yet.' : '暂无内容'}</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li
              key={post.id}
              className="group flex items-stretch overflow-hidden rounded-lg border border-border/80 bg-card motion-safe:transition-colors motion-safe:duration-200 hover:bg-accent/40"
            >
              <Link
                href={pathWithLocale(`/blog/${post.id}`, locale)}
                className="flex min-w-0 flex-1 items-center px-4 py-3 text-sm text-foreground outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background cursor-pointer"
              >
                <span className="min-w-0 truncate">{postListTitle(post, locale)}</span>
              </Link>
              {isAdmin ? (
                <div className="flex shrink-0 items-center border-l border-border/60 bg-card px-2 group-hover:bg-transparent motion-safe:transition-colors motion-safe:duration-200">
                  <AdminPostEditEntry
                    postId={post.id}
                    className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
