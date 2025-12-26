"use client";

import Link from "next/link";
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
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs max-h-[70vh] overflow-y-auto lg:max-h-[70vh]">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          onClick={onCloseMobileMenu}
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>返回首页</span>
        </Link>
        {showCollapseButton && onCollapse && (
          <button
            onClick={onCollapse}
            className="text-gray-500 hover:text-gray-700 transition-colors"
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
      <div className="text-sm font-semibold text-gray-900 mb-3">目录</div>

      {/* 目录列表 */}
      <nav className="space-y-1">
        {toc.map((item) => (
          <button
            key={item.id}
            onClick={() => onScrollToHeading(item.id)}
            className={`block w-full text-left text-sm py-1 px-2 rounded cursor-pointer transition-colors ${
              activeId === item.id
                ? "text-blue-600 bg-blue-50 font-medium"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600 pt-4 border-t border-gray-200 transition-colors cursor-pointer"
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

