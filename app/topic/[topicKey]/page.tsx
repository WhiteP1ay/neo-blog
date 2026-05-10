import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getHomeExplorerData } from '@/server/actions/posts';
import { SiteShell } from '@/components/site/SiteShell';
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
    return (
      <SiteShell>
        <p className="text-sm text-muted-foreground">加载列表失败，请稍后重试。</p>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <PostList categories={categories} selectedTopicKey={selectedTopicKey} />
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
