import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getHomeExplorerData } from '@/server/actions/posts';
import { BlogCategoryTabBar } from './BlogCategoryTabBar';
import { WeChatAD } from '@/components/site/WeChatAD';
import {
  buildBlogTopicUiState,
  resolveTopicSelection,
} from './topicsHandle';
import { PostList } from './PostList';

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
  const topicState = await resolveBlogTopicState(searchParams);
  if (!topicState) {
    return <p>加载分类失败</p>
  }
  const { listPosts, activeKey, tabs } = topicState;
  return (
    <>
      <BlogCategoryTabBar tabs={tabs} activeKey={activeKey} />
      <PostList posts={listPosts} />
      <hr className="site-hr" />
      <WeChatAD />
    </>
  );
}

async function resolveBlogTopicState(
  searchParams: Promise<{ topic?: string }>,
) {
  const sp = await searchParams;

  const selection = resolveTopicSelection(sp.topic);
  const explorerResult = await getHomeExplorerData();

  if (!explorerResult.success) {
    return null;
  }

  const topicState = buildBlogTopicUiState(explorerResult.data, selection);
  if (!topicState.ok) {
    redirect('/blog');
  }
  return topicState;
}
