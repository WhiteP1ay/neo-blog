'use client';

/**
 * Home Explorer 的 URL 导航逻辑（topic/post 写入 search params）。
 *
 * 说明：
 * - 这里不做 UI 状态，仅负责 router.replace/refresh
 * - 以 payload 类型为输入，计算 activeCategory/posts 等派生数据
 */

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { HomeExplorerCategoryPayload } from '../type/home-explorer-payload';
import { topicToQueryValue } from '../utils/home-explorer';

export function useHomeExplorerNavigation(categories: HomeExplorerCategoryPayload[], activeTopicQuery: string) {
  const router = useRouter();

  const refreshExplorer = useCallback(() => {
    router.refresh();
  }, [router]);

  const clearPostFromUrl = useCallback(() => {
    const p = new URLSearchParams();
    p.set('topic', activeTopicQuery);
    router.replace(`/?${p.toString()}`);
  }, [activeTopicQuery, router]);

  const navigateTopic = useCallback(
    (topicKey: number) => {
      const t = topicToQueryValue(topicKey);
      const p = new URLSearchParams();
      p.set('topic', t);
      router.replace(`/?${p.toString()}`);
    },
    [router],
  );

  const navigatePost = useCallback(
    (topicKey: number, postId: number) => {
      const t = topicToQueryValue(topicKey);
      const p = new URLSearchParams();
      p.set('topic', t);
      p.set('post', String(postId));
      router.replace(`/?${p.toString()}`);
    },
    [router],
  );

  const activeCategory = useMemo(
    () => categories.find((c) => topicToQueryValue(c.topicKey) === activeTopicQuery) ?? categories[0],
    [categories, activeTopicQuery],
  );

  const posts = activeCategory?.posts ?? [];

  return {
    refreshExplorer,
    navigateTopic,
    navigatePost,
    clearPostFromUrl,
    activeCategory,
    posts,
  };
}

