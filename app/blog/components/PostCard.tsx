import Link from 'next/link';
import type { Post } from '@/server/actions/posts';
import { formatDate } from '@/app/utils/date';

interface PostCardProps {
  post: Post;
  showPinned?: boolean;
}

/**
 * 文章卡片组件
 */
export function PostCard({ post, showPinned = true }: PostCardProps) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6">
      <div className="flex items-start gap-2 mb-2 sm:mb-3">
        <Link href={`/blog/${post.id}`} className="flex-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {post.title}
          </h2>
        </Link>
        {showPinned && post.isPinned && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 whitespace-nowrap">
            📌 置顶
          </span>
        )}
      </div>
      {post.createdAt && (
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{formatDate(post.createdAt)}</div>
      )}
    </article>
  );
}
