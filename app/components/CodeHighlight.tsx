"use client";

import { useEffect } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css"; // 使用GitHub暗色主题

/**
 * 代码高亮组件
 * 自动高亮页面中的所有代码块
 */
export function CodeHighlight() {
  useEffect(() => {
    // 使用 setTimeout 确保 DOM 已渲染
    const timer = setTimeout(() => {
      // 高亮所有代码块
      const codeBlocks = document.querySelectorAll("pre code");
      codeBlocks.forEach((block) => {
        if (!block.classList.contains("hljs")) {
          hljs.highlightElement(block as HTMLElement);
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

