'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useAdminUiStore } from '../../store/admin-ui';

/**
 * 将 zustand store 的 setter 适配为 React setState 形状，方便组件直接复用。
 */
export function useAdminUiCompat() {
  const editingPost = useAdminUiStore((s) => s.editingPost);
  const setEditingPost = useAdminUiStore((s) => s.setEditingPost);

  const newTopicOpen = useAdminUiStore((s) => s.newTopicOpen);
  const setNewTopicOpen = useAdminUiStore((s) => s.setNewTopicOpen);
  const newTopicName = useAdminUiStore((s) => s.newTopicName);
  const setNewTopicName = useAdminUiStore((s) => s.setNewTopicName);

  const renameTopicState = useAdminUiStore((s) => s.renameTopicState);
  const setRenameTopicState = useAdminUiStore((s) => s.setRenameTopicState);
  const deleteTopicId = useAdminUiStore((s) => s.deleteTopicId);
  const setDeleteTopicId = useAdminUiStore((s) => s.setDeleteTopicId);

  const renamePostState = useAdminUiStore((s) => s.renamePostState);
  const setRenamePostState = useAdminUiStore((s) => s.setRenamePostState);
  const deletePostId = useAdminUiStore((s) => s.deletePostId);
  const setDeletePostId = useAdminUiStore((s) => s.setDeletePostId);

  const listDropActive = useAdminUiStore((s) => s.listDropActive);
  const setListDropActive = useAdminUiStore((s) => s.setListDropActive);

  const setRenameTopicStateCompat: Dispatch<SetStateAction<{ id: number; name: string } | null>> = (next) => {
    const prev = useAdminUiStore.getState().renameTopicState;
    const resolved = typeof next === 'function' ? next(prev) : next;
    setRenameTopicState(resolved);
  };

  const setDeleteTopicIdCompat: Dispatch<SetStateAction<number | null>> = (next) => {
    const prev = useAdminUiStore.getState().deleteTopicId;
    const resolved = typeof next === 'function' ? next(prev) : next;
    setDeleteTopicId(resolved);
  };

  const setRenamePostStateCompat: Dispatch<SetStateAction<{ id: number; title: string } | null>> = (next) => {
    const prev = useAdminUiStore.getState().renamePostState;
    const resolved = typeof next === 'function' ? next(prev) : next;
    setRenamePostState(resolved);
  };

  const setDeletePostIdCompat: Dispatch<SetStateAction<number | null>> = (next) => {
    const prev = useAdminUiStore.getState().deletePostId;
    const resolved = typeof next === 'function' ? next(prev) : next;
    setDeletePostId(resolved);
  };

  return {
    editingPost,
    setEditingPost,

    newTopicOpen,
    setNewTopicOpen,
    newTopicName,
    setNewTopicName,

    renameTopicState,
    setRenameTopicState,
    setRenameTopicStateCompat,

    deleteTopicId,
    setDeleteTopicId,
    setDeleteTopicIdCompat,

    renamePostState,
    setRenamePostState,
    setRenamePostStateCompat,

    deletePostId,
    setDeletePostId,
    setDeletePostIdCompat,

    listDropActive,
    setListDropActive,
  };
}

