'use client';

import type { ChangeEvent, DragEvent, DragEventHandler, RefObject } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { uploadMarkdownFromForm } from '@/server/actions/posts';
import { addPostToTopic } from '@/server/actions/topics';
import type { HomeExplorerCategoryPayload } from '../../type/payload';

type UseAdminUploadArgs = {
  isAdminLoggedIn: boolean;
  activeCategory: HomeExplorerCategoryPayload | undefined;
  refreshExplorer: () => void;
  navigatePost: (topicKey: number, postId: number) => void;
  setEditingPost: (v: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  setListDropActive: (active: boolean) => void;
};

/**
 * 上传 markdown + 拖拽上传交互。
 */
export function useAdminUpload({
  isAdminLoggedIn,
  activeCategory,
  refreshExplorer,
  navigatePost,
  setEditingPost,
  showToast,
  setListDropActive,
}: UseAdminUploadArgs) {
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

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

  return {
    uploadFileInputRef: uploadFileInputRef as RefObject<HTMLInputElement | null>,
    uploadMarkdownFile,
    handleUploadMarkdownInput,
    listDropHandlers,
  };
}

