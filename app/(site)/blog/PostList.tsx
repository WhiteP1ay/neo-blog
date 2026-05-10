'use client';

import { useMemo } from 'react';
import type { HomeExplorerCategory, HomeExplorerPostPreview } from '@/server/types/explorer';
import Link from 'next/link';
import { AdminPostEditEntry } from '@/components/admin/AdminPostEditEntry';
import { Button } from '@/components/ui/button';
import { useIsAdmin } from '@/hooks/admin/useIsAdmin';
import { encodeTopicPathSegment } from '@/lib/url/segmentEncoding';
import { cn } from '@/lib/utils';

interface PostListProps {
  categories: HomeExplorerCategory[];
  /**
   * 当前路由对应的专题 key；首页「全部」为 `all`，与 {@link HomeExplorerCategory.topicKey} 一致。
   */
  selectedTopicKey: string;
}

/**
 * 生成分类导航的目标路径：虚拟「全部」用首页 `/`，其余用 `/topic/<编码后的 key>` 以便刷新保留状态。
 */
function topicHref(topicKey: string): string {
  if (topicKey === 'all') {
    return '/';
  }
  return `/topic/${encodeTopicPathSegment(topicKey)}`;
}

export function PostList({ categories, selectedTopicKey }: PostListProps) {
  const isAdmin = useIsAdmin();
  const posts = useMemo<HomeExplorerPostPreview[]>(() => {
    const activeCategory = categories.find((category) => category.topicKey === selectedTopicKey);
    return activeCategory?.posts ?? [];
  }, [selectedTopicKey, categories]);

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2" aria-label="专题筛选">
        {categories.map((category) => {
          const selected = selectedTopicKey === category.topicKey;
          return (
            <Button
              key={category.topicKey}
              variant={selected ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 rounded-full px-3 text-xs font-normal shadow-none motion-safe:transition-colors motion-safe:duration-200',
              )}
              asChild
            >
              <Link
                href={topicHref(category.topicKey)}
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
        <p className="text-sm text-muted-foreground">暂无内容</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li
              key={post.id}
              className="group flex items-stretch overflow-hidden rounded-lg border border-border/80 bg-card motion-safe:transition-colors motion-safe:duration-200 hover:bg-accent/40"
            >
              <Link
                href={`/blog/${post.id}`}
                className="flex min-w-0 flex-1 items-center px-4 py-3 text-sm text-foreground outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background cursor-pointer"
              >
                <span className="min-w-0 truncate">{post.title}</span>
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
