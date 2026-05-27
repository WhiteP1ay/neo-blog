'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useAdminConsoleMutations } from '@/hooks/admin/useAdminConsoleMutations';
import { useAdminConsoleQueries } from '@/hooks/admin/useAdminConsoleQueries';
import { parseAdminJsonResponse } from '@/lib/admin-json';
import { useToast } from '@/components/Toast';
import type { PostItem, TabKey } from './types';

/**
 * 将 AdminConsole 的数据获取、表单状态、增删改操作集中到 hook。
 */
export function useAdminConsole(initialTab: TabKey) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { users, posts, postTypes, photos, comments, loading, error } = useAdminConsoleQueries();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoDesc, setNewPhotoDesc] = useState('');
  const [newPhotoType, setNewPhotoType] = useState('');
  const [newPhotoIsHidden, setNewPhotoIsHidden] = useState(false);
  const [photoUploadHint, setPhotoUploadHint] = useState('');

  const [commentTargetType, setCommentTargetType] = useState<'post' | 'photo'>('post');
  const [commentTargetId, setCommentTargetId] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentContent, setCommentContent] = useState('');

  const mutations = useAdminConsoleMutations();

  const invalidateInBackground = useCallback(
    (key: ReadonlyArray<unknown>) => {
      void queryClient.invalidateQueries({ queryKey: [...key] });
    },
    [queryClient],
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const createUser = async () => {
    try {
      await mutations.createUser({
        name: newUserName,
        password: newUserPassword,
        isAdmin: newUserIsAdmin,
      });
      setNewUserName('');
      setNewUserPassword('');
      setNewUserIsAdmin(false);
    } catch {
      /* 错误已在 mutation onError 中 toast */
    }
  };

  const uploadPostFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', '');
    formData.append('isHidden', 'false');
    try {
      await fetch('/api/admin/posts', { method: 'POST', body: formData }).then((res) =>
        parseAdminJsonResponse<PostItem>(res, true),
      );
      showToast(`已从 Markdown 创建：${file.name}`, 'success');
      invalidateInBackground(['admin', 'posts']);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '上传失败', 'error');
    }
  };

  const createPhoto = async () => {
    try {
      await mutations.createPhoto({
        title: newPhotoTitle,
        description: newPhotoDesc,
        type: newPhotoType,
        isHidden: newPhotoIsHidden,
      });
      setNewPhotoTitle('');
      setNewPhotoDesc('');
      setNewPhotoType('');
      setNewPhotoIsHidden(false);
    } catch {
      /* mutation onError */
    }
  };

  const uploadPhotoFile = async (file: File) => {
    try {
      await mutations.uploadPhoto({
        file,
        title: newPhotoTitle,
        description: newPhotoDesc,
        type: newPhotoType,
        isHidden: newPhotoIsHidden,
      });
      setPhotoUploadHint(`已上传: ${file.name}`);
    } catch {
      /* mutation onError */
    }
  };

  const createComment = async () => {
    try {
      await mutations.createComment({
        targetType: commentTargetType,
        targetId: Number.parseInt(commentTargetId, 10),
        author: commentAuthor,
        content: commentContent,
      });
      setCommentTargetId('');
      setCommentAuthor('');
      setCommentContent('');
    } catch {
      /* mutation onError */
    }
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    error,
    users,
    posts,
    postTypes,
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
      deleteUser: mutations.deleteUser,
    },
    postForm: {
      uploadPostFile,
      togglePostHidden: mutations.togglePostHidden,
      deletePost: mutations.deletePost,
      reorderPosts: mutations.reorderPosts,
      bulkReplacePostTypes: mutations.bulkReplacePostTypes,
      bulkDeletePosts: mutations.bulkDeletePosts,
      bulkSetPostsHidden: mutations.bulkSetPostsHidden,
      bulkAiPolishPosts: mutations.bulkAiPolishPosts,
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
      togglePhotoHidden: mutations.togglePhotoHidden,
      deletePhoto: mutations.deletePhoto,
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
      deleteComment: mutations.deleteComment,
    },
  };
}
