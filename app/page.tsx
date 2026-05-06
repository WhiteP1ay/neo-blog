import type { Metadata } from 'next';
import { getHomeExplorerData } from '@/server/actions/posts';
import { DocContainer } from '@/components/site/retro/DocContainer';
import { SiteHeader } from '@/components/site/retro/SiteHeader';
import { SiteFooter } from '@/components/site/retro/SiteFooter';
import { PostList } from '@/app/(site)/blog/PostList';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'White Meta',
  description: 'White Meta 复古文档风博客首页',
  keywords: ['博客', '技术文章', '编程', '开发', '复古网站'],
  openGraph: {
    title: 'White Meta',
    description: 'White Meta 复古文档风博客首页',
    type: 'website',
  },
};

export default async function Home({
  searchParams: _searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  void _searchParams;
  const categories = await resolveHomeCategories();
  if (!categories) {
    return <p className="text-sm text-muted-foreground">加载列表失败，请稍后重试。</p>;
  }

  return (
    <div id="top" className="retro-site min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main className="py-5 sm:py-8">
        <DocContainer>
          <PostList categories={categories} />
        </DocContainer>
      </main>
      <SiteFooter />
    </div>
  );
}

async function resolveHomeCategories() {
  const result = await getHomeExplorerData();
  if (!result.success || result.data.length === 0) {
    return null;
  }
  return result.data;
}
