"use client";

import { BackToHome } from "@/app/components/BackToHome";
import type { TocItem } from "./types";

interface TocContentProps {
  toc: TocItem[];
  activeId: string;
  showBackToTop: boolean;
  showCollapseButton?: boolean;
  onScrollToHeading: (id: string) => void;
  onScrollToTop: () => void;
  onCollapse?: () => void;
  onCloseMobileMenu?: () => void;
}

/**
 * 目录内容组件（桌面端和移动端共用）
 */
export function TocContent({
  toc,
  activeId,
  showBackToTop,
  showCollapseButton = false,
  onScrollToHeading,
  onScrollToTop,
  onCollapse,
  onCloseMobileMenu,
}: TocContentProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xs max-h-[70vh] overflow-y-auto lg:max-h-[70vh]">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <BackToHome onClick={onCloseMobileMenu} />
        {showCollapseButton && onCollapse && (
          <button
            onClick={onCollapse}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            aria-label="折叠目录"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 目录标题 */}
      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">目录</div>

      {/* 目录列表 */}
      <nav className="space-y-1">
        {toc.map((item) => (
          <button
            key={item.id}
            onClick={() => onScrollToHeading(item.id)}
            className={`block w-full text-left text-sm py-1 px-2 rounded cursor-pointer transition-colors ${
              activeId === item.id
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            style={{
              paddingLeft: `${(item.level - 1) * 0.75 + 0.5}rem`,
            }}
          >
            {item.text}
          </button>
        ))}
      </nav>

      {/* 返回顶部按钮 */}
      {showBackToTop && (
        <button
          onClick={() => {
            onScrollToTop();
            onCloseMobileMenu?.();
          }}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
          aria-label="返回顶部"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          <span>返回顶部</span>
        </button>
      )}
    </div>
  );
}

