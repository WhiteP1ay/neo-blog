'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Topic } from '@/server/actions/topics';
import { formatDate } from '@/app/utils/date';

interface TopicItemProps {
  topic: Topic & {
    posts: Array<{ id: number; title: string; createdAt: Date | null }>;
  };
}

/**
 * 专题列表项组件（可展开显示文章）
 */
export function TopicItem({ topic }: TopicItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6">
      <div className="flex items-start gap-2 mb-2 sm:mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0 mt-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={isExpanded ? '收起' : '展开'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{topic.name}</h2>
          {topic.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{topic.description}</p>}
        </div>
        {topic.isPinned && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 whitespace-nowrap">
            📌 置顶
          </span>
        )}
      </div>
      {topic.createdAt && (
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">{formatDate(topic.createdAt)}</div>
      )}

      {/* 展开的文章列表 */}
      {isExpanded && topic.posts.length > 0 && (
        <div className="mt-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
          {topic.posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="block py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 -ml-2 transition-colors"
            >
              <h3 className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {post.title}
              </h3>
              {post.createdAt && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(post.createdAt)}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
