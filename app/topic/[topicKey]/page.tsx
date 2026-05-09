import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getHomeExplorerData } from '@/server/actions/posts';
import { DocContainer } from '@/components/site/retro/DocContainer';
import { SiteHeader } from '@/components/site/retro/SiteHeader';
import { SiteFooter } from '@/components/site/retro/SiteFooter';
import { PostList } from '@/app/(site)/blog/PostList';
import { decodeTopicPathSegment } from '@/lib/url/segmentEncoding';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ topicKey: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topicKey: rawSegment } = await params;
  const decoded = decodeTopicPathSegment(rawSegment);
  const label = decoded === '' ? '未命名' : decoded;
  const title = `${label} | White Meta`;
  return {
    title,
    description: `White Meta — ${label} 分类`,
    openGraph: {
      title,
      description: `White Meta — ${label}`,
      type: 'website',
    },
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { topicKey: rawSegment } = await params;
  if (!rawSegment) {
    notFound();
  }
  const selectedTopicKey = decodeTopicPathSegment(rawSegment);
  /** 虚拟「全部」与首页 / 对应，统一重定向避免重复 URL */
  if (selectedTopicKey === 'all') {
    redirect('/');
  }

  const categories = await resolveHomeCategories();
  if (!categories) {
    return <p className="text-sm text-muted-foreground">加载列表失败，请稍后重试。</p>;
  }

  return (
    <div id="top" className="retro-site min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main className="py-5 sm:py-8">
        <DocContainer>
          <PostList categories={categories} selectedTopicKey={selectedTopicKey} />
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
