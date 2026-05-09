'use client';

import { useMemo } from 'react';
import type { HomeExplorerCategory, HomeExplorerPostPreview } from "@/server/types/explorer";
import Link from "next/link";
import { AdminPostEditEntry } from "@/components/admin/AdminPostEditEntry";
import { useIsAdmin } from "@/hooks/admin/useIsAdmin";
import { encodeTopicPathSegment } from '@/lib/url/segmentEncoding';

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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            key={category.topicKey}
            href={topicHref(category.topicKey)}
            scroll={false}
            className={`rounded border px-2 py-1 text-xs hover:bg-muted ${
              selectedTopicKey === category.topicKey ? 'bg-muted font-medium' : ''
            }`}
            aria-current={selectedTopicKey === category.topicKey ? 'page' : undefined}
          >
            {category.name}
          </Link>
        ))}
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无内容</p>
      ) : (
        <ul className="retro-paper space-y-2 rounded-sm p-4">
          {posts.map((post) => (
            <li key={post.id} className="group ml-5 list-disc text-sm">
              <Link href={`/blog/${post.id}`} className="align-middle">
                {post.title}
              </Link>
              {isAdmin ? (
                <AdminPostEditEntry
                  postId={post.id}
                  className="ml-1 align-middle opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

