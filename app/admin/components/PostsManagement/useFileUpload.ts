import { useState, useRef } from 'react';
import { useToast } from '@/app/components/Toast';
import type { Post } from '@/server/actions/posts';

/**
 * 文件上传Hook
 */
export function useFileUpload(onSuccess?: () => void) {
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (file: File, postId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (postId) {
      formData.append('postId', postId.toString());
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        showToast(postId ? '文章更新成功' : '文章创建成功', 'success');
        onSuccess?.();
        setEditingPost(null);
      } else {
        showToast(`上传失败: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('上传失败:', error);
      showToast('上传失败', 'error');
    }
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.name.endsWith('.md')) {
      handleFileUpload(file, editingPost?.id);
    } else {
      showToast('请选择.md文件', 'warning');
    }
    e.target.value = '';
  };

  /**
   * 处理拖拽上传
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.md')) {
      handleFileUpload(file);
    } else {
      showToast('请拖拽.md文件', 'warning');
    }
  };

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /**
   * 开始编辑文章（用于更新）
   */
  const startEdit = (post: Post) => {
    setEditingPost(post);
    fileInputRef.current?.click();
  };

  /**
   * 开始创建新文章
   */
  const startCreate = () => {
    setEditingPost(null);
    fileInputRef.current?.click();
  };

  return {
    editingPost,
    fileInputRef,
    dropZoneRef,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    startEdit,
    startCreate,
  };
}
