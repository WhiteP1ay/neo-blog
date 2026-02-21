import { useEffect, useState } from 'react';
import type { TocItem } from './types';

/**
 * Hook: 从 DOM 中提取标题并生成目录
 */
export function useTableOfContents(content: string) {
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    // 等待 DOM 渲染完成
    const timer = setTimeout(() => {
      const article = document.querySelector('article');
      if (!article) return;

      const headings = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const tocItems: TocItem[] = [];
      const idMap = new Map<string, number>(); // 用于处理重复的标题

      headings.forEach((heading) => {
        const text = heading.textContent?.trim() || '';
        if (!text) return;

        // 如果标题已有 ID，直接使用
        if (heading.id) {
          const level = parseInt(heading.tagName.charAt(1), 10);
          tocItems.push({ id: heading.id, text, level });
          return;
        }

        // 生成唯一 ID
        let id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // 移除特殊字符
          .replace(/\s+/g, '-') // 空格替换为连字符
          .replace(/-+/g, '-'); // 多个连字符合并为一个

        // 处理重复的 ID
        if (idMap.has(id)) {
          const count = idMap.get(id)! + 1;
          idMap.set(id, count);
          id = `${id}-${count}`;
        } else {
          idMap.set(id, 0);
        }

        // 为页面中的标题设置 ID，以便跳转
        heading.id = id;

        const level = parseInt(heading.tagName.charAt(1), 10);
        tocItems.push({ id, text, level });
      });

      setToc(tocItems);
    }, 100); // 延迟 100ms 确保 DOM 已渲染

    return () => clearTimeout(timer);
  }, [content]);

  return toc;
}
