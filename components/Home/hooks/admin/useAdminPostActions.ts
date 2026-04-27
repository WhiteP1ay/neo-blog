'use client';

import { useCallback } from 'react';
import { createPost, deletePost, updatePost } from '@/server/actions/posts';
import { addPostToTopic, movePostToTopicTarget } from '@/server/actions/topics';
import type { HomeExplorerCategoryPayload } from '../../type/payload';

type UseAdminPostActionsArgs = {
  isAdminLoggedIn: boolean;
  activeCategory: HomeExplorerCategoryPayload | undefined;
  activePostId: number | null;
  refreshExplorer: () => void;
  navigatePost: (topicKey: number, postId: number) => void;
  clearPostFromUrl: () => void;
  setEditingPost: (v: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  renamePostState: { id: number; title: string } | null;
  setRenamePostState: (s: { id: number; title: string } | null) => void;
  deletePostId: number | null;
  setDeletePostId: (id: number | null) => void;
};

export function useAdminPostActions({
  isAdminLoggedIn,
  activeCategory,
  activePostId,
  refreshExplorer,
  navigatePost,
  clearPostFromUrl,
  setEditingPost,
  showToast,
  renamePostState,
  setRenamePostState,
  deletePostId,
  setDeletePostId,
}: UseAdminPostActionsArgs) {
  const handleCreatePost = useCallback(async () => {
    if (!isAdminLoggedIn || !activeCategory) {
      return;
    }
    const r = await createPost({ title: '无标题', content: '<p></p>' });
    if (!r.success) {
      showToast(r.error, 'error');
      return;
    }
    const id = r.data.id;
    const tk = activeCategory.topicKey;
    if (tk !== 0) {
      const add = await addPostToTopic(tk, id);
      if (!add.success) {
        showToast(add.error ?? '加入专题失败', 'warning');
      }
    }
    refreshExplorer();
    navigatePost(tk, id);
    setEditingPost(true);
  }, [activeCategory, isAdminLoggedIn, navigatePost, refreshExplorer, setEditingPost, showToast]);

  const submitRenamePost = useCallback(async () => {
    if (!isAdminLoggedIn || !renamePostState) {
      return;
    }
    const title = renamePostState.title.trim() || '无标题';
    const r = await updatePost(renamePostState.id, { title });
    if (!r.success) {
      showToast(r.error ?? '重命名失败', 'error');
      return;
    }
    showToast('已更新标题', 'success');
    setRenamePostState(null);
    refreshExplorer();
  }, [isAdminLoggedIn, refreshExplorer, renamePostState, setRenamePostState, showToast]);

  const submitDeletePost = useCallback(async () => {
    if (!isAdminLoggedIn || deletePostId == null) {
      return;
    }
    const r = await deletePost(deletePostId);
    if (!r.success) {
      showToast(r.error ?? '删除失败', 'error');
      return;
    }
    showToast('已删除', 'success');
    if (activePostId === deletePostId) {
      clearPostFromUrl();
    }
    setDeletePostId(null);
    refreshExplorer();
  }, [activePostId, clearPostFromUrl, deletePostId, isAdminLoggedIn, refreshExplorer, setDeletePostId, showToast]);

  const handleMovePost = useCallback(
    async (postId: number, target: number) => {
      if (!isAdminLoggedIn) {
        return;
      }
      const r = await movePostToTopicTarget(postId, target);
      if (!r.success) {
        showToast(r.error ?? '移动失败', 'error');
        return;
      }
      showToast('已移动', 'success');
      refreshExplorer();
      navigatePost(target, postId);
    },
    [isAdminLoggedIn, navigatePost, refreshExplorer, showToast],
  );

  const handleTogglePostPin = useCallback(
    async (postId: number, nextPinned: boolean) => {
      if (!isAdminLoggedIn) {
        return;
      }
      const r = await updatePost(postId, { isPinned: nextPinned });
      if (!r.success) {
        showToast(r.error ?? '操作失败', 'error');
        return;
      }
      showToast(nextPinned ? '已置顶' : '已取消置顶', 'success');
      refreshExplorer();
    },
    [isAdminLoggedIn, refreshExplorer, showToast],
  );

  const openPostEditor = useCallback(
    (topicKey: number, postId: number) => {
      navigatePost(topicKey, postId);
      setEditingPost(true);
    },
    [navigatePost, setEditingPost],
  );

  return {
    handleCreatePost,
    submitRenamePost,
    submitDeletePost,
    handleMovePost,
    handleTogglePostPin,
    openPostEditor,
  };
}

