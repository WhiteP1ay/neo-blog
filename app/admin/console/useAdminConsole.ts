'use client';

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { CommentItem, PhotoItem, PostItem, TabKey, UserItem } from './types';

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
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('');
  const [newPostIsHidden, setNewPostIsHidden] = useState(false);
  const [postUploadHint, setPostUploadHint] = useState('');
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

  const [usersQuery, postsQuery, photosQuery, commentsQuery] = useQueries({
    queries: [
      {
        queryKey: ['admin', 'users'],
        queryFn: async () => (await fetch('/api/admin/users').then((res) => parseJsonResponse<UserItem[]>(res, true))) ?? [],
      },
      {
        queryKey: ['admin', 'posts'],
        queryFn: async () => (await fetch('/api/admin/posts').then((res) => parseJsonResponse<PostItem[]>(res, true))) ?? [],
      },
      {
        queryKey: ['admin', 'photos'],
        queryFn: async () => (await fetch('/api/admin/photos').then((res) => parseJsonResponse<PhotoItem[]>(res, true))) ?? [],
      },
      {
        queryKey: ['admin', 'comments'],
        queryFn: async () =>
          (await fetch('/api/admin/comments').then((res) => parseJsonResponse<CommentItem[]>(res, true))) ?? [],
      },
    ],
  });

  const users = usersQuery.data ?? [];
  const posts = postsQuery.data ?? [];
  const photos = photosQuery.data ?? [];
  const comments = commentsQuery.data ?? [];

  /** 只在「尚无缓存数据」时视为加载中；后台 refetch 不刷屏 */
  const loading = useMemo(
    () => [usersQuery, postsQuery, photosQuery, commentsQuery].some((query) => query.isLoading),
    [usersQuery, postsQuery, photosQuery, commentsQuery],
  );

  const error = useMemo(() => {
    const firstError = [usersQuery, postsQuery, photosQuery, commentsQuery].find((query) => query.error)?.error;
    if (!firstError) return '';
    return firstError instanceof Error ? firstError.message : '加载失败';
  }, [usersQuery, postsQuery, photosQuery, commentsQuery]);

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
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

  const createPost = async () => {
    await fetch('/api/admin/posts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: newPostTitle,
        content: newPostContent,
        type: newPostType,
        isHidden: newPostIsHidden,
      }),
    }).then((res) => parseJsonResponse<PostItem>(res, true));
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostType('');
    setNewPostIsHidden(false);
    await refreshAll();
  };

  const uploadPostFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', newPostTitle);
    formData.append('type', newPostType);
    formData.append('isHidden', String(newPostIsHidden));
    await fetch('/api/admin/posts', { method: 'POST', body: formData }).then((res) =>
      parseJsonResponse<PostItem>(res, true),
    );
    setPostUploadHint(`已上传: ${file.name}`);
    await refreshAll();
  };

  const togglePostHidden = async (item: PostItem) => {
    await fetch(`/api/admin/posts/${item.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isHidden: !item.isHidden }),
    }).then((res) => parseJsonResponse<PostItem>(res, true));
    await refreshAll();
  };

  const deletePost = async (id: number) => {
    await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' }).then((res) =>
      parseJsonResponse<{ success: boolean }>(res, false),
    );
    await refreshAll();
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

  const startEditPost = (post: PostItem) => {
    setEditingPostId(post.id);
    setEditPostTitle(post.title);
    setEditPostContent(post.content);
    setEditPostType(post.type ?? '');
    setEditPostIsHidden(post.isHidden);
    setEditPostExcerpt(post.excerpt ?? '');
    setEditPostCoverUrl(post.coverUrl ?? '');
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

  const savePostEdit = async () => {
    if (!editingPostId || !Number.isFinite(editingPostId)) {
      throw new Error('无效博文ID');
    }
    if (!editPostTitle.trim()) {
      throw new Error('标题不能为空');
    }
    if (!editPostContent.trim()) {
      throw new Error('内容不能为空');
    }
    await fetch(`/api/admin/posts/${editingPostId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: editPostTitle,
        content: editPostContent,
        type: editPostType,
        isHidden: editPostIsHidden,
        excerpt: editPostExcerpt,
        coverUrl: editPostCoverUrl,
      }),
    }).then((res) => parseJsonResponse<PostItem>(res, true));
    await refreshAll();
    cancelEditPost();
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
      newPostTitle,
      setNewPostTitle,
      newPostContent,
      setNewPostContent,
      newPostType,
      setNewPostType,
      newPostIsHidden,
      setNewPostIsHidden,
      postUploadHint,
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
      createPost,
      uploadPostFile,
      togglePostHidden,
      deletePost,
      startEditPost,
      cancelEditPost,
      savePostEdit,
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
