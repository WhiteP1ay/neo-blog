import { formatDate } from "@/app/utils/date";

interface PostHeaderProps {
  title: string;
  createdAt: Date | null;
  publishedTime?: string;
}

/**
 * 文章头部组件
 */
export function PostHeader({ title, createdAt, publishedTime }: PostHeaderProps) {
  return (
    <header>
      <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
        {title}
      </h1>
      {createdAt && (
        <time
          dateTime={publishedTime}
          className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 block"
        >
          {formatDate(createdAt)}
        </time>
      )}
    </header>
  );
}

