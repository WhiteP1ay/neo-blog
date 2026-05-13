'use client';

import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { parseAdminJsonResponse } from '@/lib/admin-json';
import type {
  CommentItem,
  PhotoItem,
  PostItem,
  PostTypeAdminRow,
  UserItem,
} from '@/components/admin/console/types';

/**
 * 管理控制台五张列表的并行查询；挂载后再 enabled，避免水合与 SSR 缓存不一致。
 */
export function useAdminConsoleQueries() {
  const [queriesEnabled, setQueriesEnabled] = useState(false);
  useEffect(() => {
    setQueriesEnabled(true);
  }, []);

  const [usersQuery, postsQuery, postTypesQuery, photosQuery, commentsQuery] = useQueries({
    queries: [
      {
        queryKey: ['admin', 'users'],
        queryFn: async () =>
          (await fetch('/api/admin/users').then((res) => parseAdminJsonResponse<UserItem[]>(res, true))) ?? [],
        enabled: queriesEnabled,
      },
      {
        queryKey: ['admin', 'posts'],
        queryFn: async () =>
          (await fetch('/api/admin/posts').then((res) => parseAdminJsonResponse<PostItem[]>(res, true))) ?? [],
        enabled: queriesEnabled,
      },
      {
        queryKey: ['admin', 'post-types'],
        queryFn: async () =>
          (await fetch('/api/admin/post-types').then((res) =>
            parseAdminJsonResponse<PostTypeAdminRow[]>(res, true),
          )) ?? [],
        enabled: queriesEnabled,
      },
      {
        queryKey: ['admin', 'photos'],
        queryFn: async () =>
          (await fetch('/api/admin/photos').then((res) => parseAdminJsonResponse<PhotoItem[]>(res, true))) ?? [],
        enabled: queriesEnabled,
      },
      {
        queryKey: ['admin', 'comments'],
        queryFn: async () =>
          (await fetch('/api/admin/comments').then((res) => parseAdminJsonResponse<CommentItem[]>(res, true))) ?? [],
        enabled: queriesEnabled,
      },
    ],
  });

  const users = usersQuery.data ?? [];
  const posts = postsQuery.data ?? [];
  const postTypes = postTypesQuery.data ?? [];
  const photos = photosQuery.data ?? [];
  const comments = commentsQuery.data ?? [];

  const loading = useMemo(
    () =>
      queriesEnabled &&
      [usersQuery, postsQuery, postTypesQuery, photosQuery, commentsQuery].some((q) => q.isLoading),
    [queriesEnabled, usersQuery, postsQuery, postTypesQuery, photosQuery, commentsQuery],
  );

  const error = useMemo(() => {
    if (!queriesEnabled) return '';
    const first = [usersQuery, postsQuery, postTypesQuery, photosQuery, commentsQuery].find((q) => q.error)?.error;
    if (!first) return '';
    return first instanceof Error ? first.message : '加载失败';
  }, [queriesEnabled, usersQuery, postsQuery, postTypesQuery, photosQuery, commentsQuery]);

  return {
    queriesEnabled,
    users,
    posts,
    postTypes,
    photos,
    comments,
    loading,
    error,
  };
}
