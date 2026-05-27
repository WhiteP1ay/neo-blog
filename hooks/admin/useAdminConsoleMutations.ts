'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseAdminJsonResponse } from '@/lib/admin-json';
import { ADMIN_REORDER_UNCATEGORIZED_TYPE_ID } from '@/lib/admin-post-constants';
import { useToast } from '@/components/Toast';
import type { CommentItem, PhotoItem, PostItem, UserItem } from '@/components/admin/console/types';

type CreateCommentPayload = {
  targetType: 'post' | 'photo';
  targetId: number;
  author: string;
  content: string;
};

type CreateUserPayload = {
  name: string;
  password: string;
  isAdmin: boolean;
};

type CreatePhotoPayload = {
  title: string;
  description: string;
  type: string;
  isHidden: boolean;
};

type UploadPhotoPayload = {
  file: File;
  title: string;
  description: string;
  type: string;
  isHidden: boolean;
};

/**
 * 管理控制台列表相关的 mutation（乐观更新 + 精准失效）。
 */
export function useAdminConsoleMutations() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const togglePostHiddenMutation = useMutation({
    mutationFn: async (item: PostItem) => {
      await fetch(`/api/admin/posts/${item.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isHidden: !item.isHidden }),
      }).then((res) => parseAdminJsonResponse<PostItem>(res, true));
    },
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'posts'] });
      const previousPosts = queryClient.getQueryData<PostItem[]>(['admin', 'posts']) ?? [];
      queryClient.setQueryData(
        ['admin', 'posts'],
        previousPosts.map((p) => (p.id === item.id ? { ...p, isHidden: !item.isHidden } : p)),
      );
      return { previousPosts };
    },
    onError: (err, _item, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['admin', 'posts'], context.previousPosts);
      }
      showToast(err instanceof Error ? err.message : '更新失败', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  const reorderPostsMutation = useMutation({
    mutationFn: async ({ orderedIds, typeId }: { orderedIds: number[]; typeId: number }) => {
      await fetch('/api/admin/posts/reorder', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderedIds, typeId }),
      }).then((res) => parseAdminJsonResponse<{ success: boolean }>(res, false));
    },
    onMutate: async ({ orderedIds, typeId }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'posts'] });
      const previousPosts = queryClient.getQueryData<PostItem[]>(['admin', 'posts']) ?? [];
      if (previousPosts.length > 0) {
        const rank = new Map<number, number>(orderedIds.map((id, index) => [id, index]));
        const inScope = (post: PostItem) =>
          typeId === ADMIN_REORDER_UNCATEGORIZED_TYPE_ID
            ? post.types.length === 0
            : post.types.some((t) => t.id === typeId);
        const nextPosts = previousPosts.map((post) =>
          inScope(post) && rank.has(post.id) ? { ...post, sortOrder: (rank.get(post.id) ?? 0) + 1 } : post,
        );
        queryClient.setQueryData(['admin', 'posts'], nextPosts);
      }
      return { previousPosts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['admin', 'posts'], context.previousPosts);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' }).then((res) =>
        parseAdminJsonResponse<{ success: boolean }>(res, false),
      );
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'posts'] });
      const previousPosts = queryClient.getQueryData<PostItem[]>(['admin', 'posts']) ?? [];
      queryClient.setQueryData(
        ['admin', 'posts'],
        previousPosts.filter((p) => p.id !== id),
      );
      return { previousPosts };
    },
    onError: (err, _id, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['admin', 'posts'], context.previousPosts);
      }
      showToast(err instanceof Error ? err.message : '删除失败', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' }).then((res) =>
        parseAdminJsonResponse<{ success: boolean }>(res, false),
      );
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] });
      const previous = queryClient.getQueryData<UserItem[]>(['admin', 'users']) ?? [];
      queryClient.setQueryData(
        ['admin', 'users'],
        previous.filter((u) => u.id !== id),
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'users'], context.previous);
      }
      showToast(err instanceof Error ? err.message : '删除失败', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/admin/photos/${id}`, { method: 'DELETE' }).then((res) =>
        parseAdminJsonResponse<{ success: boolean }>(res, false),
      );
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'photos'] });
      const previous = queryClient.getQueryData<PhotoItem[]>(['admin', 'photos']) ?? [];
      queryClient.setQueryData(
        ['admin', 'photos'],
        previous.filter((p) => p.id !== id),
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'photos'], context.previous);
      }
      showToast(err instanceof Error ? err.message : '删除失败', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'photos'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' }).then((res) =>
        parseAdminJsonResponse<{ success: boolean }>(res, false),
      );
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'comments'] });
      const previous = queryClient.getQueryData<CommentItem[]>(['admin', 'comments']) ?? [];
      queryClient.setQueryData(
        ['admin', 'comments'],
        previous.filter((c) => c.id !== id),
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'comments'], context.previous);
      }
      showToast(err instanceof Error ? err.message : '删除失败', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
  });

  const togglePhotoHiddenMutation = useMutation({
    mutationFn: async (item: PhotoItem) => {
      await fetch(`/api/admin/photos/${item.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isHidden: !item.isHidden }),
      }).then((res) => parseAdminJsonResponse<PhotoItem>(res, true));
    },
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'photos'] });
      const previous = queryClient.getQueryData<PhotoItem[]>(['admin', 'photos']) ?? [];
      queryClient.setQueryData(
        ['admin', 'photos'],
        previous.map((p) => (p.id === item.id ? { ...p, isHidden: !item.isHidden } : p)),
      );
      return { previous };
    },
    onError: (err, _item, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'photos'], context.previous);
      }
      showToast(err instanceof Error ? err.message : '更新失败', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'photos'] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (payload: CreateCommentPayload) => {
      return fetch('/api/admin/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((res) => parseAdminJsonResponse<CommentItem>(res, true));
    },
    onSuccess: (created) => {
      if (!created) return;
      queryClient.setQueryData<CommentItem[]>(['admin', 'comments'], (prev) => [created, ...(prev ?? [])]);
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : '创建失败', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (body: CreateUserPayload) => {
      return fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).then((res) => parseAdminJsonResponse<UserItem>(res, true));
    },
    onSuccess: (user) => {
      if (!user) return;
      queryClient.setQueryData<UserItem[]>(['admin', 'users'], (prev) => [...(prev ?? []), user]);
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : '创建失败', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const createPhotoMutation = useMutation({
    mutationFn: async (body: CreatePhotoPayload) => {
      return fetch('/api/admin/photos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).then((res) => parseAdminJsonResponse<PhotoItem>(res, true));
    },
    onSuccess: (photo) => {
      if (!photo) return;
      queryClient.setQueryData<PhotoItem[]>(['admin', 'photos'], (prev) => [photo, ...(prev ?? [])]);
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : '创建失败', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'photos'] });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (vars: UploadPhotoPayload) => {
      const formData = new FormData();
      formData.append('file', vars.file);
      formData.append('title', vars.title);
      formData.append('description', vars.description);
      formData.append('type', vars.type);
      formData.append('isHidden', String(vars.isHidden));
      return fetch('/api/admin/photos', { method: 'POST', body: formData }).then((res) =>
        parseAdminJsonResponse<PhotoItem>(res, true),
      );
    },
    onSuccess: (photo) => {
      if (!photo) return;
      queryClient.setQueryData<PhotoItem[]>(['admin', 'photos'], (prev) => [photo, ...(prev ?? [])]);
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : '上传失败', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'photos'] });
    },
  });

  const bulkReplacePostTypesMutation = useMutation({
    mutationFn: async ({ postIds, typeIds }: { postIds: number[]; typeIds: number[] }) => {
      await fetch('/api/admin/posts/bulk-types', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postIds, typeIds }),
      }).then((res) => parseAdminJsonResponse<{ success: boolean; updatedCount: number }>(res, false));
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : '批量更新类型失败', 'error');
    },
    onSuccess: (_data, vars) => {
      showToast(`已更新 ${vars.postIds.length} 篇文章的类型`, 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  const bulkDeletePostsMutation = useMutation({
    mutationFn: async (postIds: number[]) => {
      await fetch('/api/admin/posts/bulk', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postIds }),
      }).then((res) => parseAdminJsonResponse<{ success: boolean; deletedCount: number }>(res, false));
    },
    onMutate: async (postIds) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'posts'] });
      const previousPosts = queryClient.getQueryData<PostItem[]>(['admin', 'posts']) ?? [];
      const idSet = new Set(postIds);
      queryClient.setQueryData(
        ['admin', 'posts'],
        previousPosts.filter((p) => !idSet.has(p.id)),
      );
      return { previousPosts };
    },
    onError: (err, _ids, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['admin', 'posts'], context.previousPosts);
      }
      showToast(err instanceof Error ? err.message : '批量删除失败', 'error');
    },
    onSuccess: (_data, postIds) => {
      showToast(`已删除 ${postIds.length} 篇文章`, 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  const bulkSetPostsHiddenMutation = useMutation({
    mutationFn: async ({ postIds, isHidden }: { postIds: number[]; isHidden: boolean }) => {
      await fetch('/api/admin/posts/bulk-visibility', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postIds, isHidden }),
      }).then((res) => parseAdminJsonResponse<{ success: boolean; updatedCount: number }>(res, false));
    },
    onMutate: async ({ postIds, isHidden }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'posts'] });
      const previousPosts = queryClient.getQueryData<PostItem[]>(['admin', 'posts']) ?? [];
      const idSet = new Set(postIds);
      queryClient.setQueryData(
        ['admin', 'posts'],
        previousPosts.map((p) => (idSet.has(p.id) ? { ...p, isHidden } : p)),
      );
      return { previousPosts };
    },
    onError: (err, _vars, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['admin', 'posts'], context.previousPosts);
      }
      showToast(err instanceof Error ? err.message : '批量更新可见性失败', 'error');
    },
    onSuccess: (_data, vars) => {
      showToast(`已${vars.isHidden ? '隐藏' : '显示'} ${vars.postIds.length} 篇文章`, 'success');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  const bulkAiPolishPosts = async (
    postIds: number[],
    options: { polishCn: boolean; translateAppendEn: boolean },
    onProgress?: (current: number, total: number) => void,
  ): Promise<{ ok: number; failed: Array<{ postId: number; error: string }> }> => {
    const failed: Array<{ postId: number; error: string }> = [];
    let ok = 0;
    for (let i = 0; i < postIds.length; i += 1) {
      onProgress?.(i + 1, postIds.length);
      const postId = postIds[i];
      try {
        const res = await fetch(`/api/admin/posts/${postId}/ai-polish/run`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(options),
        });
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          failed.push({ postId, error: json.error ?? `请求失败（${res.status}）` });
        } else {
          ok += 1;
        }
      } catch (e) {
        failed.push({ postId, error: e instanceof Error ? e.message : '未知错误' });
      }
    }
    await queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    if (failed.length === 0) {
      showToast(`批量润色完成，共 ${ok} 篇`, 'success');
    } else if (ok === 0) {
      showToast(`批量润色全部失败（${failed.length} 篇）`, 'error');
    } else {
      showToast(`批量润色：成功 ${ok} 篇，失败 ${failed.length} 篇`, 'error');
    }
    return { ok, failed };
  };

  return {
    togglePostHidden: (item: PostItem) => togglePostHiddenMutation.mutateAsync(item),
    reorderPosts: (orderedIds: number[], typeId: number) => reorderPostsMutation.mutateAsync({ orderedIds, typeId }),
    deletePost: (id: number) => deletePostMutation.mutateAsync(id),
    deleteUser: (id: number) => deleteUserMutation.mutateAsync(id),
    deletePhoto: (id: number) => deletePhotoMutation.mutateAsync(id),
    deleteComment: (id: number) => deleteCommentMutation.mutateAsync(id),
    togglePhotoHidden: (item: PhotoItem) => togglePhotoHiddenMutation.mutateAsync(item),
    createComment: (payload: CreateCommentPayload) => createCommentMutation.mutateAsync(payload),
    createUser: (payload: CreateUserPayload) => createUserMutation.mutateAsync(payload),
    createPhoto: (payload: CreatePhotoPayload) => createPhotoMutation.mutateAsync(payload),
    uploadPhoto: (payload: UploadPhotoPayload) => uploadPhotoMutation.mutateAsync(payload),
    bulkReplacePostTypes: (postIds: number[], typeIds: number[]) =>
      bulkReplacePostTypesMutation.mutateAsync({ postIds, typeIds }),
    bulkDeletePosts: (postIds: number[]) => bulkDeletePostsMutation.mutateAsync(postIds),
    bulkSetPostsHidden: (postIds: number[], isHidden: boolean) =>
      bulkSetPostsHiddenMutation.mutateAsync({ postIds, isHidden }),
    bulkAiPolishPosts,
  };
}
