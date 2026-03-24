import Link from 'next/link';
import type { Post } from '@/server/actions/posts';
import { formatDate } from '@/app/utils/date';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';

interface PostCardProps {
  post: Post;
  showPinned?: boolean;
}

/**
 * 文章卡片组件（列表页，移动端与桌面共用 shadcn Card）
 */
export function PostCard({ post, showPinned = true }: PostCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-2 flex items-start gap-2 sm:mb-3">
          <Link href={`/blog/${post.id}`} className="flex-1">
            <h2 className="text-xl font-semibold text-foreground transition-colors hover:text-primary sm:text-2xl">
              {post.title}
            </h2>
          </Link>
          {showPinned && post.isPinned ? (
            <Badge variant="outline" className="shrink-0 border-amber-500/50 text-amber-700 dark:text-amber-300">
              置顶
            </Badge>
          ) : null}
        </div>
        {post.createdAt ? (
          <div className="text-muted-foreground text-xs sm:text-sm">{formatDate(post.createdAt)}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
