"use client";

import { useState } from "react";
import { TocContent } from "./TocContent";
import type { TocItem } from "./types";

interface MobileTOCProps {
  toc: TocItem[];
  activeId: string;
  showBackToTop: boolean;
  onScrollToHeading: (id: string) => void;
  onScrollToTop: () => void;
}

/**
 * 移动端目录组件
 */
export function MobileTOC({
  toc,
  activeId,
  showBackToTop,
  onScrollToHeading,
  onScrollToTop,
}: MobileTOCProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (toc.length === 0) {
    return null;
  }

  return (
    <>
      {/* 浮动按钮 */}
      <div className="fixed bottom-20 right-4 z-50 lg:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="打开目录"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* 返回顶部按钮 */}
      {showBackToTop && (
        <div className="fixed bottom-4 right-4 z-50 lg:hidden">
          <button
            onClick={onScrollToTop}
            className="bg-gray-800 text-white rounded-full p-3 shadow-lg hover:bg-gray-900 transition-colors"
            aria-label="返回顶部"
          >
            <svg
              className="w-6 h-6"
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
          </button>
        </div>
      )}

      {/* 抽屉式目录 */}
      {isMenuOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 bg-gray-500 opacity-30 z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* 抽屉内容 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden transform translate-y-0 transition-transform duration-300 ease-out">
            <div className="bg-white rounded-t-lg shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold text-gray-900">目录</h3>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="关闭目录"
                >
                  <svg
                    className="w-6 h-6"
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
              </div>
              <div className="p-4">
                <TocContent
                  toc={toc}
                  activeId={activeId}
                  showBackToTop={showBackToTop}
                  onScrollToHeading={(id) => {
                    onScrollToHeading(id);
                    setIsMenuOpen(false);
                  }}
                  onScrollToTop={() => {
                    onScrollToTop();
                    setIsMenuOpen(false);
                  }}
                  onCloseMobileMenu={() => setIsMenuOpen(false)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

