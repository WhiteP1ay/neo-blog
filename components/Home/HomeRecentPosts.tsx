import Link from 'next/link';
import type { HomePostPreview } from '@/server/actions/posts';
import { formatDateShort } from '@/app/utils/date';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface HomeRecentPostsProps {
  posts: HomePostPreview[];
}

/**
 * 首页左侧：最近文章列表（最多 5 篇）
 */
export function HomeRecentPosts({ posts }: HomeRecentPostsProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">最近文章</CardTitle>
        <p className="text-muted-foreground text-sm">最新 {posts.length} 篇，置顶优先</p>
      </CardHeader>
      <CardContent className="pt-0">
        {posts.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">暂无文章，稍后再来看看吧～</p>
        ) : (
          <ul className="flex flex-col">
            {posts.map((post, index) => (
              <li key={post.id}>
                {index > 0 ? <Separator className="my-1" /> : null}
                <Link
                  href={`/blog/${post.id}`}
                  className="hover:bg-accent/60 -mx-2 block rounded-md px-2 py-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-foreground line-clamp-2 flex-1 text-sm font-medium leading-snug sm:text-base">
                      {post.title}
                    </span>
                    {post.isPinned ? (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-amber-500/40 text-xs text-amber-700 dark:text-amber-300"
                      >
                        置顶
                      </Badge>
                    ) : null}
                  </div>
                  {post.createdAt ? (
                    <time className="text-muted-foreground mt-1 block text-xs" dateTime={post.createdAt.toISOString()}>
                      {formatDateShort(post.createdAt)}
                    </time>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-border pt-4">
          <Link href="/blog" className="text-primary text-sm font-medium hover:underline">
            查看全部博客 →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
