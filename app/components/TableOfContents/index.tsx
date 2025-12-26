"use client";

import { useTableOfContents } from "./useTableOfContents";
import { useScrollTracking, useScrollActions } from "./useScrollTracking";
import { DesktopTOC } from "./DesktopTOC";
import { MobileTOC } from "./MobileTOC";
import type { TableOfContentsProps } from "./types";

/**
 * 文章目录组件
 * 从 HTML 内容中提取标题，生成目录，支持点击跳转
 */
export function TableOfContents({ content }: TableOfContentsProps) {
  // 提取标题并生成目录
  const toc = useTableOfContents(content);

  // 跟踪滚动位置
  const { activeId, showBackToTop } = useScrollTracking(toc);

  // 滚动操作
  const { scrollToHeading, scrollToTop } = useScrollActions();

  if (toc.length === 0) {
    return null;
  }

  return (
    <>
      <DesktopTOC
        toc={toc}
        activeId={activeId}
        showBackToTop={showBackToTop}
        onScrollToHeading={scrollToHeading}
        onScrollToTop={scrollToTop}
      />
      <MobileTOC
        toc={toc}
        activeId={activeId}
        showBackToTop={showBackToTop}
        onScrollToHeading={scrollToHeading}
        onScrollToTop={scrollToTop}
      />
    </>
  );
}

