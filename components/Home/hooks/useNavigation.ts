'use client';

/**
 * URL 导航逻辑（topic/post 写入 search params）。
 */

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { HomeExplorerCategoryPayload } from '../type/payload';
import { topicToQueryValue } from '../utils/explorer';

export function useNavigation(categories: HomeExplorerCategoryPayload[], activeTopicQuery: string) {
  const router = useRouter();

  const refreshExplorer = useCallback(() => {
    router.refresh();
  }, [router]);

  const clearPostFromUrl = useCallback(() => {
    const p = new URLSearchParams();
    p.set('topic', activeTopicQuery);
    router.replace(`/admin?${p.toString()}`);
  }, [activeTopicQuery, router]);

  const navigateTopic = useCallback(
    (topicKey: number) => {
      const t = topicToQueryValue(topicKey);
      const p = new URLSearchParams();
      p.set('topic', t);
      router.replace(`/admin?${p.toString()}`);
    },
    [router],
  );

  const navigatePost = useCallback(
    (topicKey: number, postId: number) => {
      const t = topicToQueryValue(topicKey);
      const p = new URLSearchParams();
      p.set('topic', t);
      p.set('post', String(postId));
      router.replace(`/admin?${p.toString()}`);
    },
    [router],
  );

  const activeCategory = useMemo(
    () => categories.find((c) => topicToQueryValue(c.topicKey) === activeTopicQuery) ?? categories[0],
    [categories, activeTopicQuery],
  );

  const posts = activeCategory?.posts ?? [];

  return { refreshExplorer, navigateTopic, navigatePost, clearPostFromUrl, activeCategory, posts };
}

