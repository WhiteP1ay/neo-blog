import type { Metadata } from 'next';
import { getMixedList, type ListItem } from '@/server/actions/posts';
import { TopicItem } from '@/app/components/TopicItem';
import { Breadcrumb } from '@/app/components/Breadcrumb';
import { PostCard } from '@/app/components/PostDetail/PostCard';
import { WeChatSidebar } from '@/app/components/WeChatSidebar';

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

/**
 * 博客首页 - 文章列表（支持专题）
 */
export default async function BlogPage() {
  // 默认显示专题，可以通过查询参数控制
  const result = await getMixedList(true);
  const items: ListItem[] = result.success && result.data ? result.data : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex gap-8">
          {/* 主内容区域 */}
          <div className="flex-1 min-w-0">
            <Breadcrumb />
            {items.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500">暂无内容</div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {items.map((item) => {
                  if (item.type === 'topic') {
                    return <TopicItem key={`topic-${item.data.id}`} topic={item.data} />;
                  } else {
                    return <PostCard key={`post-${item.data.id}`} post={item.data} />;
                  }
                })}
              </div>
            )}
          </div>

          {/* 右侧 Sticky 侧边栏 */}
          <WeChatSidebar />
        </div>
      </div>
    </div>
  );
}
