"use client";

import Link from "next/link";

interface PostNavigationProps {
  prev: { id: number; title: string } | null;
  next: { id: number; title: string } | null;
}

/**
 * 文章导航组件（上一篇/下一篇）
 */
export function PostNavigation({ prev, next }: PostNavigationProps) {
  if (!prev && !next) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 上一篇 */}
        <div>
          {prev ? (
            <Link
              href={`/${prev.id}`}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">上一篇</div>
              <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {prev.title}
              </div>
            </Link>
          ) : (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 opacity-50">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">上一篇</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">没有更多了</div>
            </div>
          )}
        </div>

        {/* 下一篇 */}
        <div>
          {next ? (
            <Link
              href={`/${next.id}`}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group text-right"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">下一篇</div>
              <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {next.title}
              </div>
            </Link>
          ) : (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 opacity-50 text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">下一篇</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">没有更多了</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

