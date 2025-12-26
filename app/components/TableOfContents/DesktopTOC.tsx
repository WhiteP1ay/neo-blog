"use client";

import { useState } from "react";
import { TocContent } from "./TocContent";
import type { TocItem } from "./types";

interface DesktopTOCProps {
  toc: TocItem[];
  activeId: string;
  showBackToTop: boolean;
  onScrollToHeading: (id: string) => void;
  onScrollToTop: () => void;
}

/**
 * PC 端目录组件
 */
export function DesktopTOC({
  toc,
  activeId,
  showBackToTop,
  onScrollToHeading,
  onScrollToTop,
}: DesktopTOCProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (toc.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
          aria-label="展开目录"
        >
          <svg
            className="w-6 h-6 text-gray-600"
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
      ) : (
        <TocContent
          toc={toc}
          activeId={activeId}
          showBackToTop={showBackToTop}
          showCollapseButton={true}
          onScrollToHeading={onScrollToHeading}
          onScrollToTop={onScrollToTop}
          onCollapse={() => setIsCollapsed(true)}
        />
      )}
    </div>
  );
}

