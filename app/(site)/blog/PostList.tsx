'use client';

import { useMemo, useState } from 'react';
import type { HomeExplorerCategory, HomeExplorerPostPreview } from "@/server/types/explorer";
import Link from "next/link";

interface PostListProps {
  categories: HomeExplorerCategory[];
}

export function PostList({ categories }: PostListProps) {
  const [activeType, setActiveType] = useState('all');
  const posts = useMemo<HomeExplorerPostPreview[]>(() => {
    const activeCategory = categories.find((category) => category.topicKey === activeType);
    return activeCategory?.posts ?? [];
  }, [activeType, categories]);

  if (posts.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无内容</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.topicKey}
            type="button"
            className="rounded border px-2 py-1 text-xs hover:bg-muted"
            onClick={() => setActiveType(category.topicKey)}
            aria-pressed={activeType === category.topicKey}
          >
            {category.name}
          </button>
        ))}
      </div>
      <ul className="retro-paper space-y-2 rounded-sm p-4">
        {posts.map((post) => (
          <li key={post.id} className="ml-5 list-disc text-sm">
            <Link href={`/blog/${post.id}`} className="align-middle">
              {post.title}
            </Link>
            {/* <span className="ml-2 text-xs text-muted-foreground">
              {formatDate(post.createdAt)}
            </span> */}
          </li>
        ))}
      </ul>
    </div>
  );
}

