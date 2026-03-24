'use client';

import { useTableOfContents } from './useTableOfContents';
import { useScrollTracking, useScrollActions } from './useScrollTracking';
import { DesktopTOC } from './DesktopTOC';
import { MobileTOC } from './MobileTOC';

/**
 * 文章目录组件
 * 从 HTML 内容中提取标题，生成目录，支持点击跳转
 */
export function TableOfContents() {
  // 提取标题并生成目录
  const toc = useTableOfContents();

  // 跟踪滚动位置
  const { activeId, showBackToTop } = useScrollTracking();

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
