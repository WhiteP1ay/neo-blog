'use client';

/**
 * 文章列表行的“内容区域”（标题 + 时间 + 置顶标）。
 *
 * 说明：
 * - 这里只做展示，交互由父组件包裹 button/context-menu 提供
 */

import { formatDateShort } from '@/app/utils/date';
import { Badge } from '@/components/ui/badge';
import type { HomeExplorerCategoryPayload } from '../type/home-explorer-payload';

type PostPreview = HomeExplorerCategoryPayload['posts'][number];

type HomeExplorerPostRowBodyProps = {
  post: PostPreview;
};

export function HomeExplorerPostRowBody({ post }: HomeExplorerPostRowBodyProps) {
  return (
    <>
      <span className="line-clamp-2 leading-snug">{post.title}</span>
      <span className="text-muted-foreground flex items-center gap-2 text-xs">
        {post.createdAt ? <time dateTime={post.createdAt}>{formatDateShort(post.createdAt)}</time> : null}
        {post.isPinned ? (
          <Badge variant="outline" className="h-5 border-amber-500/40 px-1 text-[10px]">
            置顶
          </Badge>
        ) : null}
      </span>
    </>
  );
}

