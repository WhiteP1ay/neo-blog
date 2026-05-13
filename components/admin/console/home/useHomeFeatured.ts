'use client';

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useToast } from '@/components/Toast';
import type { HomeFeaturedItem, PostItem } from '../types';

type ApiPayload<T> = { data?: T; error?: string; success?: boolean };

async function parseResponse<T>(response: Response, requireData = true): Promise<T | null> {
  const payload = (await response.json()) as ApiPayload<T>;
  if (!response.ok) throw new Error(payload.error ?? '请求失败');
  if (payload.data !== undefined) return payload.data;
  if (payload.success === true) return null;
  if (requireData) throw new Error('响应数据缺失');
  return null;
}

type FeaturedResponseItem = HomeFeaturedItem & {
  isHidden: boolean;
  homeFeatured: boolean;
  homeSortOrder: number;
};

/**
 * 首页精选数据：精选列表（带顺序）+ 候选列表（全量博文）。
 * - `featured` 已按 `homeSortOrder` 升序返回；
 * - `candidates` 从全量博文派生，过滤掉已精选与已隐藏。
 */
export function useHomeFeatured() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [featuredQuery, allPostsQuery] = useQueries({
    queries: [
      {
        queryKey: ['admin', 'home', 'featured'] as const,
        queryFn: async () =>
          (await fetch('/api/admin/home/featured').then((res) =>
            parseResponse<FeaturedResponseItem[]>(res, true),
          )) ?? [],
      },
      {
        queryKey: ['admin', 'posts'] as const,
        queryFn: async () =>
          (await fetch('/api/admin/posts').then((res) => parseResponse<PostItem[]>(res, true))) ?? [],
      },
    ],
  });

  const featured = useMemo<HomeFeaturedItem[]>(
    () =>
      (featuredQuery.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        types: row.types ?? [],
        excerpt: row.excerpt,
        coverUrl: row.coverUrl,
      })),
    [featuredQuery.data],
  );

  const candidates = useMemo<HomeFeaturedItem[]>(() => {
    const featuredIds = new Set(featured.map((item) => item.id));
    return (allPostsQuery.data ?? [])
      .filter((post) => !post.isHidden && !featuredIds.has(post.id))
      .map((post) => ({
        id: post.id,
        title: post.title,
        types: post.types ?? [],
        excerpt: post.excerpt,
        coverUrl: post.coverUrl,
      }));
  }, [allPostsQuery.data, featured]);

  const loading = featuredQuery.isLoading || allPostsQuery.isLoading;
  const error = featuredQuery.error || allPostsQuery.error;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'home', 'featured'] });
  };

  const setFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured: nextFeatured }: { id: number; featured: boolean }) => {
      await fetch(`/api/admin/home/featured/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ homeFeatured: nextFeatured }),
      }).then((res) => parseResponse<{ success: boolean }>(res, false));
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : '更新失败', 'error');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await fetch('/api/admin/home/reorder', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      }).then((res) => parseResponse<{ success: boolean }>(res, false));
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'home', 'featured'] });
      const previous = queryClient.getQueryData<FeaturedResponseItem[]>(['admin', 'home', 'featured']) ?? [];
      if (previous.length > 0) {
        const rank = new Map(orderedIds.map((id, idx) => [id, idx]));
        const next = [...previous]
          .sort(
            (a, b) =>
              (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
          )
          .map((row, idx) => ({ ...row, homeSortOrder: idx + 1 }));
        queryClient.setQueryData(['admin', 'home', 'featured'], next);
      }
      return { previous };
    },
    onError: (err, _orderedIds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'home', 'featured'], context.previous);
      }
      showToast(err instanceof Error ? err.message : '排序失败', 'error');
    },
    onSettled: () => {
      invalidate();
    },
  });

  return {
    featured,
    candidates,
    loading,
    error: error instanceof Error ? error.message : null,
    addFeatured: async (id: number) => {
      await setFeaturedMutation.mutateAsync({ id, featured: true });
    },
    removeFeatured: async (id: number) => {
      await setFeaturedMutation.mutateAsync({ id, featured: false });
    },
    reorder: async (orderedIds: number[]) => {
      await reorderMutation.mutateAsync(orderedIds);
    },
  };
}
