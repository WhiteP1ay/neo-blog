import type { Metadata } from 'next';
import { getHomeExplorerData } from '@/server/actions/posts';
import { SiteShell } from '@/components/site/SiteShell';
import { PostList } from '@/app/(site)/blog/PostList';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'White Meta',
  description: 'White Meta 白玩dev的个人网站',
  keywords: ['博客', '技术文章', '编程', '开发'],
  openGraph: {
    title: 'White Meta',
    description: 'White Meta 白玩dev的个人网站',
    type: 'website',
  },
};

export default async function Home() {
  const categories = await resolveHomeCategories();
  if (!categories) {
    return (
      <SiteShell>
        <p className="text-sm text-muted-foreground">加载列表失败，请稍后重试。</p>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <PostList categories={categories} selectedTopicKey="all" />
    </SiteShell>
  );
}

async function resolveHomeCategories() {
  const result = await getHomeExplorerData();
  if (!result.success || result.data.length === 0) {
    return null;
  }
  return result.data;
}
