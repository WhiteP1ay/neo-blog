import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getHomeExplorerData } from '@/server/actions/posts';
import { formatDate } from '@/app/utils/date';
import { Breadcrumb } from '@/components/site/Breadcrumb';
import { BlogCategoryTabBar } from '@/components/site/blog/BlogCategoryTabBar';
import { WeChatSidebar } from '@/components/site/WeChatSidebar';
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
    <main className="site-page">
      <div className="site-container">
        <Breadcrumb />
        <BlogCategoryTabBar tabs={tabs} activeKey={activeKey} />

        {listPosts.length === 0 ? (
          <p className="text-foreground/80">暂无内容</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {listPosts.map((post) => (
              <li key={post.id} className="py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <Link href={`/blog/${post.id}`} className="min-w-0 font-medium">
                    {post.isPinned ? <span className="mr-2 text-xs font-normal">[置顶]</span> : null}
                    {post.title}
                  </Link>
                  {post.createdAt ? (
                    <time dateTime={post.createdAt.toISOString()} className="shrink-0 text-xs tabular-nums text-foreground/70">
                      {formatDate(post.createdAt)}
                    </time>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        <hr className="site-hr" />
        <WeChatSidebar />
      </div>
    </main>
  );
}
