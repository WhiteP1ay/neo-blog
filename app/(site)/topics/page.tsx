import type { Metadata } from 'next';
import { getTopics } from '@/server/actions/topics';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TopicCard } from '@/components/TopicCard';
import { EmptyState } from '@/components/EmptyState';

export const metadata: Metadata = {
  title: '专题',
  description: 'White Meta 博客 - 专题列表',
};

export const revalidate = 60;

/**
 * 专题列表页面（方块排列）
 */
export default async function TopicsPage() {
  const result = await getTopics(false); // 不包含隐藏的专题
  const topics = result.success && result.data ? result.data : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <header className="mb-8 sm:mb-12">
          <Breadcrumb />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-4">专题</h1>
        </header>

        {topics.length === 0 ? (
          <EmptyState message="暂无专题" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
