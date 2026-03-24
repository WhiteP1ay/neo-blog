import Link from 'next/link';
import { formatDate } from '@/app/utils/date';

interface TopicPostItemProps {
  post: {
    id: number;
    title: string;
    createdAt: Date | null;
  };
}

/**
 * 专题详情页文章列表项组件
 */
export function TopicPostItem({ post }: TopicPostItemProps) {
  return (
    <Link href={`/${post.id}`} className="block group">
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 sm:p-8 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800">
        <div className="flex items-start gap-4">
          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3 line-clamp-2">
              {post.title}
            </h3>
            {post.createdAt && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <time dateTime={new Date(post.createdAt).toISOString()}>{formatDate(post.createdAt)}</time>
              </div>
            )}
          </div>

          {/* 箭头图标 */}
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </article>
    </Link>
  );
}
