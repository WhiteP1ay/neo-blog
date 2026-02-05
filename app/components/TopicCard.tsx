import Link from "next/link";
import Image from "next/image";
import type { Topic } from "@/server/actions/topics";
import { formatDate } from "@/app/utils/date";

interface TopicCardProps {
  topic: Topic;
}

/**
 * 专题卡片组件
 */
export function TopicCard({ topic }: TopicCardProps) {
  return (
    <Link
      href={`/topics/${topic.id}`}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
    >
      {topic.coverImage ? (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={topic.coverImage}
            alt={topic.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
      )}
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {topic.name}
          </h2>
          {topic.isPinned && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap ml-2">
              📌 置顶
            </span>
          )}
        </div>
        {topic.description && (
          <p className="text-sm text-gray-600 line-clamp-3 mt-2">
            {topic.description}
          </p>
        )}
        <div className="text-xs text-gray-500 mt-4">
          {formatDate(topic.createdAt)}
        </div>
      </div>
    </Link>
  );
}

