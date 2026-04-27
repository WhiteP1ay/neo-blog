'use client';

import { useCallback } from 'react';
import { createTopic, deleteTopic, updateTopic } from '@/server/actions/topics';
import type { HomeExplorerCategoryPayload } from '../../type/payload';
import { topicToQueryValue } from '../../utils/explorer';

type UseAdminTopicActionsArgs = {
  isAdminLoggedIn: boolean;
  refreshExplorer: () => void;
  navigateTopic: (topicKey: number) => void;
  activeTopicQuery: string;
  newTopicName: string;
  setNewTopicOpen: (open: boolean) => void;
  setNewTopicName: (name: string) => void;
  renameTopicState: { id: number; name: string } | null;
  setRenameTopicState: (s: { id: number; name: string } | null) => void;
  deleteTopicId: number | null;
  setDeleteTopicId: (id: number | null) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
};

export function useAdminTopicActions({
  isAdminLoggedIn,
  refreshExplorer,
  navigateTopic,
  activeTopicQuery,
  newTopicName,
  setNewTopicOpen,
  setNewTopicName,
  renameTopicState,
  setRenameTopicState,
  deleteTopicId,
  setDeleteTopicId,
  showToast,
}: UseAdminTopicActionsArgs) {
  const openNewTopicDialog = useCallback(() => {
    setNewTopicName('');
    setNewTopicOpen(true);
  }, [setNewTopicName, setNewTopicOpen]);

  const submitNewTopic = useCallback(async () => {
    if (!isAdminLoggedIn) {
      return;
    }
    const name = newTopicName.trim() || '未命名专题';
    const r = await createTopic({ name });
    if (!r.success) {
      showToast(r.error ?? '创建失败', 'error');
      return;
    }
    showToast('已创建专题', 'success');
    setNewTopicOpen(false);
    setNewTopicName('');
    refreshExplorer();
    if (r.data?.id != null) {
      navigateTopic(r.data.id);
    }
  }, [isAdminLoggedIn, navigateTopic, newTopicName, refreshExplorer, setNewTopicName, setNewTopicOpen, showToast]);

  const submitRenameTopic = useCallback(async () => {
    if (!isAdminLoggedIn || !renameTopicState) {
      return;
    }
    const name = renameTopicState.name.trim();
    if (!name) {
      showToast('名称不能为空', 'error');
      return;
    }
    const r = await updateTopic(renameTopicState.id, { name });
    if (!r.success) {
      showToast(r.error ?? '重命名失败', 'error');
      return;
    }
    showToast('已更新', 'success');
    setRenameTopicState(null);
    refreshExplorer();
  }, [isAdminLoggedIn, refreshExplorer, renameTopicState, setRenameTopicState, showToast]);

  const submitDeleteTopic = useCallback(async () => {
    if (!isAdminLoggedIn || deleteTopicId == null) {
      return;
    }
    const r = await deleteTopic(deleteTopicId);
    if (!r.success) {
      showToast(r.error ?? '删除失败', 'error');
      return;
    }
    showToast('已删除专题', 'success');
    if (topicToQueryValue(deleteTopicId) === activeTopicQuery) {
      navigateTopic(0);
    }
    setDeleteTopicId(null);
    refreshExplorer();
  }, [activeTopicQuery, deleteTopicId, isAdminLoggedIn, navigateTopic, refreshExplorer, setDeleteTopicId, showToast]);

  const handleToggleTopicPin = useCallback(
    async (cat: HomeExplorerCategoryPayload) => {
      if (!isAdminLoggedIn || cat.topicKey === 0) {
        return;
      }
      const r = await updateTopic(cat.topicKey, { isPinned: !cat.isPinned });
      if (!r.success) {
        showToast(r.error ?? '操作失败', 'error');
        return;
      }
      showToast(cat.isPinned ? '已取消置顶' : '已置顶', 'success');
      refreshExplorer();
    },
    [isAdminLoggedIn, refreshExplorer, showToast],
  );

  return {
    openNewTopicDialog,
    submitNewTopic,
    submitRenameTopic,
    submitDeleteTopic,
    handleToggleTopicPin,
  };
}

