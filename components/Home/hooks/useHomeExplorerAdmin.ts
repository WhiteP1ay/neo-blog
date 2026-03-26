'use client';

/**
 * Home Explorer 管理端能力（专题/文章 CRUD、拖拽上传、置顶、移动等）。
 *
 * 约束：
 * - 这里聚合服务端 actions 与 UI store，避免组件层堆满 useCallback
 * - 对外返回“可直接传给组件”的 props/handler，减少编排层负担
 */

import type { ChangeEvent, DragEvent, DragEventHandler, Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useToast } from '@/components/Toast';
import type { HomeExplorerCategoryPayload } from '../type/home-explorer-payload';
import { topicToQueryValue } from '../utils/home-explorer';
import { createPost, deletePost, updatePost, uploadMarkdownFromForm } from '@/server/actions/posts';
import { addPostToTopic, createTopic, deleteTopic, movePostToTopicTarget, updateTopic } from '@/server/actions/topics';
import { useHomeExplorerAdminUiStore } from '../store/home-explorer-admin-ui-store';

type UseHomeExplorerAdminArgs = {
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

export function useHomeExplorerAdmin({
  categories,
  activeCategory,
  activePostId,
  activeTopicQuery,
  isAdminLoggedIn,
  refreshExplorer,
  navigateTopic,
  navigatePost,
  clearPostFromUrl,
}: UseHomeExplorerAdminArgs) {
  const { showToast } = useToast();

  // 管理端 UI 状态（跨组件共享）
  const editingPost = useHomeExplorerAdminUiStore((s) => s.editingPost);
  const setEditingPost = useHomeExplorerAdminUiStore((s) => s.setEditingPost);

  const newTopicOpen = useHomeExplorerAdminUiStore((s) => s.newTopicOpen);
  const setNewTopicOpen = useHomeExplorerAdminUiStore((s) => s.setNewTopicOpen);
  const newTopicName = useHomeExplorerAdminUiStore((s) => s.newTopicName);
  const setNewTopicName = useHomeExplorerAdminUiStore((s) => s.setNewTopicName);

  const renameTopicState = useHomeExplorerAdminUiStore((s) => s.renameTopicState);
  const setRenameTopicState = useHomeExplorerAdminUiStore((s) => s.setRenameTopicState);
  const deleteTopicId = useHomeExplorerAdminUiStore((s) => s.deleteTopicId);
  const setDeleteTopicId = useHomeExplorerAdminUiStore((s) => s.setDeleteTopicId);

  const renamePostState = useHomeExplorerAdminUiStore((s) => s.renamePostState);
  const setRenamePostState = useHomeExplorerAdminUiStore((s) => s.setRenamePostState);
  const deletePostId = useHomeExplorerAdminUiStore((s) => s.deletePostId);
  const setDeletePostId = useHomeExplorerAdminUiStore((s) => s.setDeletePostId);

  const listDropActive = useHomeExplorerAdminUiStore((s) => s.listDropActive);
  const setListDropActive = useHomeExplorerAdminUiStore((s) => s.setListDropActive);

  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 为了保持现有组件 props 类型（Dispatch<SetStateAction<...>>）的兼容，
   * 为 zustand store action 做一个 “value/function updater” 兼容包装。
   */
  const setRenameTopicStateCompat: Dispatch<SetStateAction<{ id: number; name: string } | null>> = (next) => {
    const prev = useHomeExplorerAdminUiStore.getState().renameTopicState;
    const resolved = typeof next === 'function' ? next(prev) : next;
    setRenameTopicState(resolved);
  };

  const setDeleteTopicIdCompat: Dispatch<SetStateAction<number | null>> = (next) => {
    const prev = useHomeExplorerAdminUiStore.getState().deleteTopicId;
    const resolved = typeof next === 'function' ? next(prev) : next;
    setDeleteTopicId(resolved);
  };

  const setRenamePostStateCompat: Dispatch<SetStateAction<{ id: number; title: string } | null>> = (next) => {
    const prev = useHomeExplorerAdminUiStore.getState().renamePostState;
    const resolved = typeof next === 'function' ? next(prev) : next;
    setRenamePostState(resolved);
  };

  const setDeletePostIdCompat: Dispatch<SetStateAction<number | null>> = (next) => {
    const prev = useHomeExplorerAdminUiStore.getState().deletePostId;
    const resolved = typeof next === 'function' ? next(prev) : next;
    setDeletePostId(resolved);
  };

  useEffect(() => {
    // 当 URL 切换文章时，自动退出编辑态（避免错编辑）
    void activePostId;
    setEditingPost(false);
  }, [activePostId, setEditingPost]);

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

  const uploadMarkdownFile = useCallback(
    async (file: File) => {
      if (!isAdminLoggedIn || !activeCategory) {
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      let result: Awaited<ReturnType<typeof uploadMarkdownFromForm>>;
      try {
        result = await uploadMarkdownFromForm(formData);
      } catch {
        showToast('上传失败', 'error');
        return;
      }
      if (!result.success) {
        showToast(result.error, 'error');
        return;
      }
      const id = result.data.id;
      const tk = activeCategory.topicKey;
      if (tk !== 0) {
        const add = await addPostToTopic(tk, id);
        if (!add.success) {
          showToast(add.error ?? '加入专题失败', 'warning');
        }
      }
      showToast('上传成功', 'success');
      refreshExplorer();
      navigatePost(tk, id);
      setEditingPost(false);
    },
    [activeCategory, isAdminLoggedIn, navigatePost, refreshExplorer, setEditingPost, showToast],
  );

  const handleUploadMarkdownInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) {
        return;
      }
      if (!file.name.toLowerCase().endsWith('.md')) {
        showToast('请选择 .md 文件', 'warning');
        return;
      }
      void uploadMarkdownFile(file);
    },
    [showToast, uploadMarkdownFile],
  );

  const submitNewTopic = useCallback(async () => {
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
  }, [navigateTopic, newTopicName, refreshExplorer, setNewTopicName, setNewTopicOpen, showToast]);

  const submitRenameTopic = useCallback(async () => {
    if (!renameTopicState) {
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
  }, [refreshExplorer, renameTopicState, setRenameTopicState, showToast]);

  const submitDeleteTopic = useCallback(async () => {
    if (deleteTopicId == null) {
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
  }, [activeTopicQuery, deleteTopicId, navigateTopic, refreshExplorer, setDeleteTopicId, showToast]);

  const submitRenamePost = useCallback(async () => {
    if (!renamePostState) {
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
  }, [refreshExplorer, renamePostState, setRenamePostState, showToast]);

  const submitDeletePost = useCallback(async () => {
    if (deletePostId == null) {
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
  }, [activePostId, clearPostFromUrl, deletePostId, refreshExplorer, setDeletePostId, showToast]);

  const handleMovePost = useCallback(
    async (postId: number, target: number) => {
      const r = await movePostToTopicTarget(postId, target);
      if (!r.success) {
        showToast(r.error ?? '移动失败', 'error');
        return;
      }
      showToast('已移动', 'success');
      refreshExplorer();
      navigatePost(target, postId);
    },
    [navigatePost, refreshExplorer, showToast],
  );

  const { uncategorizedCategory, pinnedTopicCategories, unpinnedTopicCategories } = useMemo(() => {
    const unc = categories[0];
    const real = categories.slice(1);
    return {
      uncategorizedCategory: unc,
      pinnedTopicCategories: real.filter((c) => c.isPinned),
      unpinnedTopicCategories: real.filter((c) => !c.isPinned),
    };
  }, [categories]);

  const handleToggleTopicPin = useCallback(
    async (cat: HomeExplorerCategoryPayload) => {
      if (cat.topicKey === 0) {
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
    [refreshExplorer, showToast],
  );

  const handleTogglePostPin = useCallback(
    async (postId: number, nextPinned: boolean) => {
      const r = await updatePost(postId, { isPinned: nextPinned });
      if (!r.success) {
        showToast(r.error ?? '操作失败', 'error');
        return;
      }
      showToast(nextPinned ? '已置顶' : '已取消置顶', 'success');
      refreshExplorer();
    },
    [refreshExplorer, showToast],
  );

  const openPostEditor = useCallback(
    (topicKey: number, postId: number) => {
      navigatePost(topicKey, postId);
      setEditingPost(true);
    },
    [navigatePost, setEditingPost],
  );

  const listDropHandlers = useMemo(() => {
    if (!isAdminLoggedIn) {
      return {
        onDragEnter: undefined as DragEventHandler<HTMLElement> | undefined,
        onDragLeave: undefined as DragEventHandler<HTMLElement> | undefined,
        onDragOver: undefined as DragEventHandler<HTMLElement> | undefined,
        onDrop: undefined as DragEventHandler<HTMLElement> | undefined,
      };
    }
    return {
      onDragEnter: (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (![...e.dataTransfer.types].includes('Files')) {
          return;
        }
        setListDropActive(true);
      },
      onDragLeave: (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const next = e.relatedTarget as Node | null;
        if (next && e.currentTarget.contains(next)) {
          return;
        }
        setListDropActive(false);
      },
      onDragOver: (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
      },
      onDrop: (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setListDropActive(false);
        const file = e.dataTransfer.files[0];
        if (!file) {
          return;
        }
        if (!file.name.toLowerCase().endsWith('.md')) {
          showToast('请拖拽 .md 文件', 'warning');
          return;
        }
        void uploadMarkdownFile(file);
      },
    };
  }, [isAdminLoggedIn, setListDropActive, showToast, uploadMarkdownFile]);

  const openNewTopicDialog = useCallback(() => {
    setNewTopicName('');
    setNewTopicOpen(true);
  }, [setNewTopicName, setNewTopicOpen]);

  return {
    showToast,

    editingPost,
    setEditingPost,

    newTopicOpen,
    setNewTopicOpen,
    newTopicName,
    setNewTopicName,

    renameTopicState,
    setRenameTopicState: setRenameTopicStateCompat,
    deleteTopicId,
    setDeleteTopicId: setDeleteTopicIdCompat,

    renamePostState,
    setRenamePostState: setRenamePostStateCompat,
    deletePostId,
    setDeletePostId: setDeletePostIdCompat,

    listDropActive,
    uploadFileInputRef,

    uncategorizedCategory,
    pinnedTopicCategories,
    unpinnedTopicCategories,

    handleCreatePost,
    handleUploadMarkdownInput,
    uploadMarkdownFile,

    submitNewTopic,
    submitRenameTopic,
    submitDeleteTopic,
    submitRenamePost,
    submitDeletePost,

    handleMovePost,
    handleToggleTopicPin,
    handleTogglePostPin,

    openPostEditor,
    listDropHandlers,
    openNewTopicDialog,
  };
}

