import Link from 'next/link';
import type { HomePostPreview } from '@/server/types/explorer';
import { HomeMobileSiteBar } from '@/components/Home/HomeMobileSiteBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDateShort } from '@/app/utils/date';

interface HomeMobileFallbackProps {
  posts: HomePostPreview[];
}

/**
 * 窄屏首页：简版说明 + 进入博客 + 最近文章链接
 */
export function HomeMobileFallback({ posts }: HomeMobileFallbackProps) {
  return (
    <Card className="mx-auto max-w-lg border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          <Link href="/" className="hover:text-primary">
            White Meta
          </Link>
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          分类与三栏阅读请在桌面端打开本站；移动端可进入博客列表或单篇文章。
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <HomeMobileSiteBar />
        <Separator />
        <Button className="w-full" size="lg" asChild>
          <Link href="/blog">进入博客</Link>
        </Button>
        {posts.length > 0 ? (
          <>
            <Separator />
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">最近文章</p>
              <ul className="flex flex-col gap-1">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/blog/${post.id}`}
                      className="hover:bg-accent/60 -mx-2 block rounded-md px-2 py-2 text-sm font-medium transition-colors"
                    >
                      <span className="line-clamp-2">{post.title}</span>
                      {post.createdAt ? (
                        <time
                          className="text-muted-foreground mt-0.5 block text-xs"
                          dateTime={post.createdAt.toISOString()}
                        >
                          {formatDateShort(post.createdAt)}
                        </time>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
        <Separator />
        <p className="text-muted-foreground text-center text-xs">© 2026 White Meta. 保留所有权利。</p>
      </CardContent>
    </Card>
  );
}
