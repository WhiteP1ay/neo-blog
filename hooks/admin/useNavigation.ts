'use client';

/**
 * URL 导航逻辑（topic/post 写入 search params）。
 */

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { HomeExplorerCategoryPayload } from '@/types/admin/payload';
import { topicToQueryValue } from '@/utils/admin/explorer';

export function useNavigation(
  categories: HomeExplorerCategoryPayload[],
  activeTopicQuery: string,
  activeView: 'posts' | 'albums',
  activeAlbumId: number | null,
  activePhotoId: number | null,
) {
  const router = useRouter();

  const refreshExplorer = useCallback(() => {
    router.refresh();
  }, [router]);

  const navigateAlbums = useCallback(
    (albumId?: number, photoId?: number) => {
      const p = new URLSearchParams();
      p.set('view', 'albums');
      if (albumId != null) {
        p.set('album', String(albumId));
      }
      if (photoId != null) {
        p.set('photo', String(photoId));
      }
      router.replace(`/admin?${p.toString()}`);
    },
    [router],
  );

  const clearPostFromUrl = useCallback(() => {
    if (activeView === 'albums') {
      navigateAlbums(activeAlbumId ?? undefined);
      return;
    }
    const p = new URLSearchParams();
    p.set('topic', activeTopicQuery);
    router.replace(`/admin?${p.toString()}`);
  }, [activeAlbumId, activeTopicQuery, activeView, navigateAlbums, router]);

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

  const clearPhotoFromUrl = useCallback(() => {
    navigateAlbums(activeAlbumId ?? undefined);
  }, [activeAlbumId, navigateAlbums]);

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
    navigateAlbums,
    clearPhotoFromUrl,
    activeView,
    activeAlbumId,
    activePhotoId,
  };
}

