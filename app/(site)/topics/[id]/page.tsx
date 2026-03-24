import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTopicById, getTopics } from '@/server/actions/topics';
import { TopicHero } from '@/components/TopicHero';
import { TopicPostItem } from '@/components/TopicPostItem';
import { EmptyState } from '@/components/EmptyState';

export const revalidate = 60;

/**
 * 生成静态参数（用于静态生成）
 */
export async function generateStaticParams() {
  const result = await getTopics(false); // 不包含隐藏的专题
  const topics = result.success && result.data ? result.data : [];

  return topics.map((topic) => ({
    id: topic.id.toString(),
  }));
}

/**
 * 生成专题页面的 metadata（SEO优化）
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const topicId = parseInt(id, 10);

  if (Number.isNaN(topicId)) {
    return {};
  }

  const result = await getTopicById(topicId);
  if (!result.success || !result.data) {
    return {};
  }

  const topic = result.data;

  return {
    title: topic.name,
    description: topic.description || `${topic.name} - 专题文章集合`,
    openGraph: {
      title: topic.name,
      description: topic.description || `${topic.name} - 专题文章集合`,
      type: 'website',
      ...(topic.coverImage && { images: [topic.coverImage] }),
    },
  };
}

/**
 * 专题详情页面
 */
export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topicId = parseInt(id, 10);

  if (Number.isNaN(topicId)) {
    notFound();
  }

  const result = await getTopicById(topicId);
  if (!result.success || !result.data) {
    notFound();
  }

  const topic = result.data;

  // 如果专题被隐藏，也返回 404
  if (topic.isHidden) {
    notFound();
  }

  const posts = topic.topicPosts || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <TopicHero topic={topic} />

      {/* 文章列表区域 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">文章列表</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">共 {posts.length} 篇文章</p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <EmptyState
              message="暂无文章"
              icon={
                <svg
                  className="w-16 h-16 text-gray-300 dark:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {posts.map((topicPost) => (
              <TopicPostItem key={topicPost.post.id} post={topicPost.post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
