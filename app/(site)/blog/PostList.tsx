'use client';

import { useMemo } from 'react';
import type { HomeExplorerCategory, HomeExplorerPostPreview } from '@/server/types/explorer';
import Link from 'next/link';
import { BlogPostListCard } from '@/components/blog/BlogPostListCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSiteLocale } from '@/components/site/SiteLocaleProvider';
import { pathWithLocale } from '@/lib/site-locale';
import { publicBlogListPath } from '@/lib/blog-list-query';

interface PostListProps {
  categories: HomeExplorerCategory[];
  /**
   * 当前 URL 对应的类型码；与 {@link HomeExplorerCategory.typeCode} 一致（含空串=未分类桶）。
   */
  selectedTypeCode: string;
}

export function PostList({ categories, selectedTypeCode }: PostListProps) {
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
        <ul className="grid grid-cols-1 gap-3 sm:gap-4">
          {posts.map((post) => (
            <BlogPostListCard key={post.id} post={post} />
          ))}
        </ul>
      )}
    </div>
  );
}
