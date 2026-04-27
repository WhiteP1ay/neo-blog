'use client';

/**
 * 管理端能力（专题/文章 CRUD、拖拽上传、置顶、移动等）。
 */

import { useEffect } from 'react';
import { useToast } from '@/components/Toast';
import type { HomeExplorerCategoryPayload } from '../type/payload';
import { useAdminUiCompat } from './admin/useAdminUiCompat';
import { useAdminDerivedCategories } from './admin/useAdminDerivedCategories';
import { useAdminUpload } from './admin/useAdminUpload';
import { useAdminTopicActions } from './admin/useAdminTopicActions';
import { useAdminPostActions } from './admin/useAdminPostActions';

type UseAdminArgs = {
  categories: HomeExplorerCategoryPayload[];
  activeCategory: HomeExplorerCategoryPayload | undefined;
  activePostId: number | null;
  activeTopicQuery: string;
  isAdminLoggedIn: boolean;
  refreshExplorer: () => void;
  navigateTopic: (topicKey: number) => void;
  navigatePost: (topicKey: number, postId: number) => void;
  clearPostFromUrl: () => void;
};

export function useAdmin({
  categories,
  activeCategory,
  activePostId,
  activeTopicQuery,
  isAdminLoggedIn,
  refreshExplorer,
  navigateTopic,
  navigatePost,
  clearPostFromUrl,
}: UseAdminArgs) {
  const { showToast } = useToast();

  const ui = useAdminUiCompat();

  useEffect(() => {
    void activePostId;
    ui.setEditingPost(false);
  }, [activePostId, ui.setEditingPost]);

  const { uncategorizedCategory, pinnedTopicCategories, unpinnedTopicCategories } =
    useAdminDerivedCategories(categories);

  const upload = useAdminUpload({
    isAdminLoggedIn,
    activeCategory,
    refreshExplorer,
    navigatePost,
    setEditingPost: ui.setEditingPost,
    showToast,
    setListDropActive: ui.setListDropActive,
  });

  const topicActions = useAdminTopicActions({
    isAdminLoggedIn,
    refreshExplorer,
    navigateTopic,
    activeTopicQuery,
    newTopicName: ui.newTopicName,
    setNewTopicOpen: ui.setNewTopicOpen,
    setNewTopicName: ui.setNewTopicName,
    renameTopicState: ui.renameTopicState,
    setRenameTopicState: ui.setRenameTopicState,
    deleteTopicId: ui.deleteTopicId,
    setDeleteTopicId: ui.setDeleteTopicId,
    showToast,
  });

  const postActions = useAdminPostActions({
    isAdminLoggedIn,
    activeCategory,
    activePostId,
    refreshExplorer,
    navigatePost,
    clearPostFromUrl,
    setEditingPost: ui.setEditingPost,
    showToast,
    renamePostState: ui.renamePostState,
    setRenamePostState: ui.setRenamePostState,
    deletePostId: ui.deletePostId,
    setDeletePostId: ui.setDeletePostId,
  });

  return {
    showToast,

    editingPost: ui.editingPost,
    setEditingPost: ui.setEditingPost,

    newTopicOpen: ui.newTopicOpen,
    setNewTopicOpen: ui.setNewTopicOpen,
    newTopicName: ui.newTopicName,
    setNewTopicName: ui.setNewTopicName,

    renameTopicState: ui.renameTopicState,
    setRenameTopicState: ui.setRenameTopicStateCompat,
    deleteTopicId: ui.deleteTopicId,
    setDeleteTopicId: ui.setDeleteTopicIdCompat,

    renamePostState: ui.renamePostState,
    setRenamePostState: ui.setRenamePostStateCompat,
    deletePostId: ui.deletePostId,
    setDeletePostId: ui.setDeletePostIdCompat,

    listDropActive: ui.listDropActive,
    uploadFileInputRef: upload.uploadFileInputRef,

    uncategorizedCategory,
    pinnedTopicCategories,
    unpinnedTopicCategories,

    handleCreatePost: postActions.handleCreatePost,
    handleUploadMarkdownInput: upload.handleUploadMarkdownInput,
    uploadMarkdownFile: upload.uploadMarkdownFile,

    submitNewTopic: topicActions.submitNewTopic,
    submitRenameTopic: topicActions.submitRenameTopic,
    submitDeleteTopic: topicActions.submitDeleteTopic,
    submitRenamePost: postActions.submitRenamePost,
    submitDeletePost: postActions.submitDeletePost,

    handleMovePost: postActions.handleMovePost,
    handleToggleTopicPin: topicActions.handleToggleTopicPin,
    handleTogglePostPin: postActions.handleTogglePostPin,

    openPostEditor: postActions.openPostEditor,
    listDropHandlers: upload.listDropHandlers,
    openNewTopicDialog: topicActions.openNewTopicDialog,
  };
}

