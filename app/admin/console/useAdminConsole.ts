'use client';

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/Toast';
import type { CommentItem, PhotoItem, PostDetail, PostItem, TabKey, UserItem } from './types';

type JsonPayload<T> = {
  data?: T;
  success?: boolean;
  error?: string;
};

/**
 * 解析后端统一 JSON 响应并做错误校验。
 */
async function parseJsonResponse<T>(response: Response, requireData = true): Promise<T | null> {
  const payload = (await response.json()) as JsonPayload<T>;
  if (!response.ok) {
    throw new Error(payload.error ?? '请求失败');
  }
  if (payload.data !== undefined) {
    return payload.data;
  }
  if (payload.success === true) {
    return null;
  }
  if (requireData) {
    throw new Error('响应数据缺失');
  }
  return null;
}

/**
 * 将 AdminConsole 的数据获取、表单状态、增删改操作集中到 hook。
 */
export function useAdminConsole(initialTab: TabKey) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostType, setEditPostType] = useState('');
  const [editPostIsHidden, setEditPostIsHidden] = useState(false);
  const [editPostExcerpt, setEditPostExcerpt] = useState('');
  const [editPostCoverUrl, setEditPostCoverUrl] = useState('');

  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoDesc, setNewPhotoDesc] = useState('');
  const [newPhotoType, setNewPhotoType] = useState('');
  const [newPhotoIsHidden, setNewPhotoIsHidden] = useState(false);
  const [photoUploadHint, setPhotoUploadHint] = useState('');

  const [commentTargetType, setCommentTargetType] = useState<'post' | 'photo'>('post');
  const [commentTargetId, setCommentTargetId] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentContent, setCommentContent] = useState('');

  /**
   * 客户端挂载后再启用列表请求，避免 SSR 已渲染出表格而水合时 QueryClient 为空缓存导致 isLoading=true，
   * 与服务端 HTML 不一致触发 Hydration mismatch。
   */
  const [queriesEnabled, setQueriesEnabled] = useState(false);
  useEffect(() => {
    setQueriesEnabled(true);
  }, []);

  const [usersQuery, postsQuery, photosQuery, commentsQuery] = useQueries({
    queries: [
      {
        queryKey: ['admin', 'users'],
        queryFn: async () =>
          (await fetch('/api/admin/users').then((res) => parseJsonResponse<UserItem[]>(res, true))) ?? [],
        enabled: queriesEnabled,
      },
      {
        queryKey: ['admin', 'posts'],
        queryFn: async () =>
          (await fetch('/api/admin/posts').then((res) => parseJsonResponse<PostItem[]>(res, true))) ?? [],
        enabled: queriesEnabled,
      },
      {
        queryKey: ['admin', 'photos'],
        queryFn: async () =>
          (await fetch('/api/admin/photos').then((res) => parseJsonResponse<PhotoItem[]>(res, true))) ?? [],
        enabled: queriesEnabled,
      },
      {
        queryKey: ['admin', 'comments'],
        queryFn: async () =>
          (await fetch('/api/admin/comments').then((res) => parseJsonResponse<CommentItem[]>(res, true))) ?? [],
        enabled: queriesEnabled,
      },
    ],
  });

  const users = usersQuery.data ?? [];
  const posts = postsQuery.data ?? [];
  const photos = photosQuery.data ?? [];
  const comments = commentsQuery.data ?? [];

  /** 挂载后再根据 isLoading 展示加载态，与首帧 SSR/水合输出一致 */
  const loading = useMemo(
    () => queriesEnabled && [usersQuery, postsQuery, photosQuery, commentsQuery].some((query) => query.isLoading),
    [queriesEnabled, usersQuery, postsQuery, photosQuery, commentsQuery],
  );

  const error = useMemo(() => {
    if (!queriesEnabled) return '';
    const firstError = [usersQuery, postsQuery, photosQuery, commentsQuery].find((query) => query.error)?.error;
    if (!firstError) return '';
    return firstError instanceof Error ? firstError.message : '加载失败';
  }, [queriesEnabled, usersQuery, postsQuery, photosQuery, commentsQuery]);

  /**
   * 全量失效（仅在需要时使用）；后台 refetch 不阻塞调用方。
   */
  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  /**
   * 仅失效指定子查询并立即返回，避免操作后被远程链路慢的列表拖累 UI。
   */
  const invalidateInBackground = (key: ReadonlyArray<unknown>) => {
    void queryClient.invalidateQueries({ queryKey: [...key] });
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const createUser = async () => {
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: newUserName,
        password: newUserPassword,
        isAdmin: newUserIsAdmin,
      }),
    }).then((res) => parseJsonResponse<UserItem>(res, true));
    setNewUserName('');
    setNewUserPassword('');
    setNewUserIsAdmin(false);
    await refreshAll();
  };

  const deleteUser = async (id: number) => {
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' }).then((res) =>
      parseJsonResponse<{ success: boolean }>(res, false),
    );
    await refreshAll();
  };

  const uploadPostFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', '');
    formData.append('type', '');
    formData.append('isHidden', 'false');
    try {
      await fetch('/api/admin/posts', { method: 'POST', body: formData }).then((res) =>
        parseJsonResponse<PostItem>(res, true),
      );
      showToast(`已从 Markdown 创建：${file.name}`, 'success');
      invalidateInBackground(['admin', 'posts']);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '上传失败', 'error');
    }
  };

  const togglePostHidden = async (item: PostItem) => {
    await fetch(`/api/admin/posts/${item.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isHidden: !item.isHidden }),
    }).then((res) => parseJsonResponse<PostItem>(res, true));
    invalidateInBackground(['admin', 'posts']);
  };

  const deletePost = async (id: number) => {
    await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' }).then((res) =>
      parseJsonResponse<{ success: boolean }>(res, false),
    );
    invalidateInBackground(['admin', 'posts']);
  };

  const reorderPostsMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await fetch('/api/admin/posts/reorder', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      }).then((res) => parseJsonResponse<{ success: boolean }>(res, false));
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'posts'] });
      const previousPosts = queryClient.getQueryData<PostItem[]>(['admin', 'posts']) ?? [];
      if (previousPosts.length > 0) {
        const rank = new Map<number, number>(orderedIds.map((id, index) => [id, index]));
        const nextPosts = [...previousPosts]
          .sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
          .map((post, index) => ({ ...post, sortOrder: index + 1 }));
        queryClient.setQueryData(['admin', 'posts'], nextPosts);
      }
      return { previousPosts };
    },
    onError: (_error, _orderedIds, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['admin', 'posts'], context.previousPosts);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  const reorderPosts = async (orderedIds: number[]) => {
    await reorderPostsMutation.mutateAsync(orderedIds);
  };

  const startEditPost = async (post: PostItem) => {
    // 列表已不带 content，编辑时按需向详情接口拉完整正文。
    setEditingPostId(post.id);
    setEditPostTitle(post.title);
    setEditPostType(post.type ?? '');
    setEditPostIsHidden(post.isHidden);
    setEditPostExcerpt(post.excerpt ?? '');
    setEditPostCoverUrl(post.coverUrl ?? '');
    setEditPostContent('');
    const detail = await fetch(`/api/admin/posts/${post.id}`).then((res) => parseJsonResponse<PostDetail>(res, true));
    if (!detail) {
      throw new Error('未取到博文详情');
    }
    // 用户可能在拉详情期间又点了别的，做下校验避免错填。
    setEditingPostId((current) => {
      if (current !== post.id) return current;
      setEditPostTitle(detail.title);
      setEditPostType(detail.type ?? '');
      setEditPostIsHidden(detail.isHidden);
      setEditPostExcerpt(detail.excerpt ?? '');
      setEditPostCoverUrl(detail.coverUrl ?? '');
      setEditPostContent(detail.content);
      return current;
    });
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditPostTitle('');
    setEditPostContent('');
    setEditPostType('');
    setEditPostIsHidden(false);
    setEditPostExcerpt('');
    setEditPostCoverUrl('');
  };

  const createPhoto = async () => {
    await fetch('/api/admin/photos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: newPhotoTitle,
        description: newPhotoDesc,
        type: newPhotoType,
        isHidden: newPhotoIsHidden,
      }),
    }).then((res) => parseJsonResponse<PhotoItem>(res, true));
    setNewPhotoTitle('');
    setNewPhotoDesc('');
    setNewPhotoType('');
    setNewPhotoIsHidden(false);
    await refreshAll();
  };

  const uploadPhotoFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', newPhotoTitle);
    formData.append('description', newPhotoDesc);
    formData.append('type', newPhotoType);
    formData.append('isHidden', String(newPhotoIsHidden));
    await fetch('/api/admin/photos', { method: 'POST', body: formData }).then((res) =>
      parseJsonResponse<PhotoItem>(res, true),
    );
    setPhotoUploadHint(`已上传: ${file.name}`);
    await refreshAll();
  };

  const togglePhotoHidden = async (item: PhotoItem) => {
    await fetch(`/api/admin/photos/${item.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isHidden: !item.isHidden }),
    }).then((res) => parseJsonResponse<PhotoItem>(res, true));
    await refreshAll();
  };

  const deletePhoto = async (id: number) => {
    await fetch(`/api/admin/photos/${id}`, { method: 'DELETE' }).then((res) =>
      parseJsonResponse<{ success: boolean }>(res, false),
    );
    await refreshAll();
  };

  const createComment = async () => {
    await fetch('/api/admin/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetType: commentTargetType,
        targetId: Number.parseInt(commentTargetId, 10),
        author: commentAuthor,
        content: commentContent,
      }),
    }).then((res) => parseJsonResponse<CommentItem>(res, true));
    setCommentTargetId('');
    setCommentAuthor('');
    setCommentContent('');
    await refreshAll();
  };

  const deleteComment = async (id: number) => {
    await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' }).then((res) =>
      parseJsonResponse<{ success: boolean }>(res, false),
    );
    await refreshAll();
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    error,
    users,
    posts,
    photos,
    comments,
    userForm: {
      newUserName,
      setNewUserName,
      newUserPassword,
      setNewUserPassword,
      newUserIsAdmin,
      setNewUserIsAdmin,
      createUser,
      deleteUser,
    },
    postForm: {
      editingPostId,
      editPostTitle,
      setEditPostTitle,
      editPostContent,
      setEditPostContent,
      editPostType,
      setEditPostType,
      editPostIsHidden,
      setEditPostIsHidden,
      editPostExcerpt,
      setEditPostExcerpt,
      editPostCoverUrl,
      setEditPostCoverUrl,
      uploadPostFile,
      togglePostHidden,
      deletePost,
      startEditPost,
      cancelEditPost,
      reorderPosts,
    },
    photoForm: {
      newPhotoTitle,
      setNewPhotoTitle,
      newPhotoDesc,
      setNewPhotoDesc,
      newPhotoType,
      setNewPhotoType,
      newPhotoIsHidden,
      setNewPhotoIsHidden,
      photoUploadHint,
      createPhoto,
      uploadPhotoFile,
      togglePhotoHidden,
      deletePhoto,
    },
    commentForm: {
      commentTargetType,
      setCommentTargetType,
      commentTargetId,
      setCommentTargetId,
      commentAuthor,
      setCommentAuthor,
      commentContent,
      setCommentContent,
      createComment,
      deleteComment,
    },
  };
}
