import { useEffect, useState } from "react";
import type { TocItem } from "./types";

/**
 * Hook: 跟踪滚动位置，更新激活的标题和返回顶部按钮显示状态
 */
export function useScrollTracking(toc: TocItem[]) {
  const [activeId, setActiveId] = useState<string>("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 显示/隐藏返回顶部按钮
      setShowBackToTop(window.scrollY > 400);

      // 更新当前激活的标题
      const headings = document.querySelectorAll(
        "article h1, article h2, article h3, article h4, article h5, article h6"
      );
      let current = "";

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          // 100px 是偏移量，让标题在滚动到接近顶部时激活
          current = heading.id;
        }
      });

      if (current) {
        setActiveId(current);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // 初始调用

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [toc]); // 依赖 toc，确保标题已设置 ID

  return { activeId, showBackToTop };
}

/**
 * Hook: 滚动相关的工具函数
 */
export function useScrollActions() {
  const scrollToHeading = (id: string, onScroll?: () => void) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // 偏移量，避免被固定导航栏遮挡
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      onScroll?.();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return { scrollToHeading, scrollToTop };
}

