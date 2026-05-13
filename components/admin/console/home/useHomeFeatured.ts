'use client';

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { parseAdminJsonResponse } from '@/lib/admin-json';
import { useToast } from '@/components/Toast';
import type { HomeFeaturedItem, PostItem } from '../types';

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
            parseAdminJsonResponse<FeaturedResponseItem[]>(res, true),
          )) ??
          [],
      },
      {
        queryKey: ['admin', 'posts'] as const,
        queryFn: async () =>
          (await fetch('/api/admin/posts').then((res) => parseAdminJsonResponse<PostItem[]>(res, true))) ?? [],
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
      }).then((res) => parseAdminJsonResponse<{ success: boolean }>(res, false));
    },
    onMutate: async ({ id, featured: nextFeatured }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'home', 'featured'] });
      const prevFeatured = queryClient.getQueryData<FeaturedResponseItem[]>(['admin', 'home', 'featured']) ?? [];

      if (!nextFeatured) {
        queryClient.setQueryData(
          ['admin', 'home', 'featured'],
          prevFeatured.filter((r) => r.id !== id),
        );
        return { prevFeatured };
      }

      const posts = queryClient.getQueryData<PostItem[]>(['admin', 'posts']) ?? [];
      const post = posts.find((p) => p.id === id);
      if (!post) {
        return { prevFeatured };
      }

      const maxOrder = prevFeatured.reduce((m, r) => Math.max(m, r.homeSortOrder ?? 0), 0);
      const row: FeaturedResponseItem = {
        id: post.id,
        title: post.title,
        types: post.types,
        excerpt: post.excerpt,
        coverUrl: post.coverUrl,
        isHidden: post.isHidden,
        homeFeatured: true,
        homeSortOrder: maxOrder + 1,
      };
      queryClient.setQueryData(
        ['admin', 'home', 'featured'],
        [...prevFeatured, row].sort((a, b) => a.homeSortOrder - b.homeSortOrder),
      );
      return { prevFeatured };
    },
    onError: (err, _vars, context) => {
      if (context?.prevFeatured) {
        queryClient.setQueryData(['admin', 'home', 'featured'], context.prevFeatured);
      }
      showToast(err instanceof Error ? err.message : '更新失败', 'error');
    },
    onSettled: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await fetch('/api/admin/home/reorder', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      }).then((res) => parseAdminJsonResponse<{ success: boolean }>(res, false));
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'home', 'featured'] });
      const previous = queryClient.getQueryData<FeaturedResponseItem[]>(['admin', 'home', 'featured']) ?? [];
      if (previous.length > 0) {
        const rank = new Map(orderedIds.map((id, idx) => [id, idx]));
        const next = [...previous]
          .sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
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
