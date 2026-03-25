import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getHomeExplorerData } from '@/server/actions/posts';
import { formatDate } from '@/app/utils/date';
import { Breadcrumb } from '@/components/Breadcrumb';
import { BlogCategoryTabBar } from '@/components/blog/BlogCategoryTabBar';
import { WeChatSidebar } from '@/components/WeChatSidebar';
import {
  buildBlogTopicUiState,
  needsBlogCanonicalTopicRedirect,
  resolveTopicSelection,
} from './topicsHandle';

export const metadata: Metadata = {
  title: '博客',
  description: 'White Meta 博客 - 技术文章和编程分享',
  keywords: ['博客', '技术文章', '编程', '开发'],
  openGraph: {
    title: 'White Meta 博客',
    description: '技术文章和编程分享',
    type: 'website',
  },
};

export const revalidate = 60;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const sp = await searchParams;

  if (needsBlogCanonicalTopicRedirect(sp.topic)) {
    redirect('/blog');
  }

  const selection = resolveTopicSelection(sp.topic);

  const explorerResult = await getHomeExplorerData();

  if (!explorerResult.success) {
    return (
      <div className="bg-muted/40 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
          <p className="text-muted-foreground text-center">暂时无法加载分类</p>
        </div>
      </div>
    );
  }

  const topicState = buildBlogTopicUiState(explorerResult.data, selection);
  if (!topicState.ok) {
    redirect('/blog');
  }

  const { listPosts, activeKey, tabs } = topicState;

  return (
    <div className="bg-muted/40 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="flex gap-8">
          <div className="min-w-0 flex-1">
            <Breadcrumb />
            <BlogCategoryTabBar tabs={tabs} activeKey={activeKey} />

            {listPosts.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center sm:py-12">暂无内容</div>
            ) : (
              <ul className="m-0 list-none p-0">
                {listPosts.map((post) => (
                  <li key={post.id} className="border-border border-b py-3 last:border-b-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <Link href={`/blog/${post.id}`} className="text-foreground hover:text-primary min-w-0 font-medium">
                        {post.isPinned ? (
                          <span className="text-muted-foreground mr-2 shrink-0 text-xs font-normal">置顶</span>
                        ) : null}
                        {post.title}
                      </Link>
                      {post.createdAt ? (
                        <time
                          dateTime={post.createdAt.toISOString()}
                          className="text-muted-foreground shrink-0 text-xs tabular-nums"
                        >
                          {formatDate(post.createdAt)}
                        </time>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <WeChatSidebar />
        </div>
      </div>
    </div>
  );
}
