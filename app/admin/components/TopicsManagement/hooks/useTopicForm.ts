'use client';

import { useState, useEffect } from 'react';
import {
  createTopic,
  updateTopic,
  getTopicById,
  addPostToTopic,
  removePostFromTopic,
  updateTopicPostSortOrder,
} from '@/server/actions/topics';
import { getPosts, type Post } from '@/server/actions/posts';
import { useToast } from '@/app/components/Toast';
import type { Topic } from '@/server/actions/topics';

interface UseTopicFormProps {
  topic: Topic | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export function useTopicForm({ topic, mode, onSuccess }: UseTopicFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageError, setCoverImageError] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Array<{ postId: number; sortOrder: number }>>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // 加载专题数据（编辑模式）
  useEffect(() => {
    if (mode === 'edit' && topic) {
      setName(topic.name);
      setDescription(topic.description || '');
      setCoverImage(topic.coverImage);
      setIsPinned(topic.isPinned);
      setIsHidden(topic.isHidden);

      // 加载专题下的文章
      const loadTopicPosts = async () => {
        const result = await getTopicById(topic.id);
        if (result.success && result.data) {
          const topicPosts = result.data.topicPosts || [];
          setSelectedPosts(
            topicPosts.map((tp) => ({
              postId: tp.postId,
              sortOrder: tp.sortOrder,
            })),
          );
        }
      };
      loadTopicPosts();
    }
  }, [mode, topic]);

  // 加载所有文章
  useEffect(() => {
    const loadAllPosts = async () => {
      const result = await getPosts();
      if (result.success && result.data) {
        setAllPosts(result.data);
      }
    };
    loadAllPosts();
  }, []);

  // 验证 URL 是否有效
  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url.trim());
      return true;
    } catch {
      return false;
    }
  };

  // 处理封面图 URL 输入
  const handleCoverImageChange = (url: string) => {
    const trimmedUrl = url.trim();
    if (trimmedUrl === '') {
      setCoverImage(null);
      setCoverImageError(false);
      return;
    }

    // 如果 URL 有效，更新状态并重置错误
    if (isValidUrl(trimmedUrl)) {
      setCoverImage(trimmedUrl);
      setCoverImageError(false);
    } else {
      // URL 无效时，仍然保存输入值（用于继续编辑），但标记为错误
      setCoverImage(trimmedUrl);
      setCoverImageError(true);
    }
  };

  // 处理图片加载错误
  const handleImageError = () => {
    setCoverImageError(true);
  };

  // 处理文章选择
  const handlePostToggle = (postId: number) => {
    setSelectedPosts((prev) => {
      const exists = prev.find((p) => p.postId === postId);
      if (exists) {
        return prev.filter((p) => p.postId !== postId);
      } else {
        return [...prev, { postId, sortOrder: prev.length }];
      }
    });
  };

  // 处理文章排序（拖拽）
  const handlePostReorder = (fromIndex: number, toIndex: number) => {
    setSelectedPosts((prev) => {
      const sorted = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      return sorted.map((p, index) => ({ ...p, sortOrder: index }));
    });
  };

  // 批量添加文章
  const handleBatchAddPosts = (postIds: number[]) => {
    setSelectedPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.postId));
      const newPosts = postIds
        .filter((id) => !existingIds.has(id))
        .map((id, index) => ({
          postId: id,
          sortOrder: prev.length + index,
        }));
      return [...prev, ...newPosts];
    });
  };

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('请输入专题名称', 'error');
      return;
    }

    setLoading(true);
    try {
      let topicId: number;

      if (mode === 'create') {
        const result = await createTopic({
          name: name.trim(),
          description: description.trim() || null,
          coverImage,
          isPinned,
          isHidden,
        });

        if (!result.success) {
          showToast(`创建失败: ${result.error}`, 'error');
          setLoading(false);
          return;
        }

        topicId = result.data?.id || 0;
      } else {
        if (!topic) return;

        const result = await updateTopic(topic.id, {
          name: name.trim(),
          description: description.trim() || null,
          coverImage,
          isPinned,
          isHidden,
        });

        if (!result.success) {
          showToast(`更新失败: ${result.error}`, 'error');
          setLoading(false);
          return;
        }

        topicId = topic.id;
      }

      // 更新专题内的文章
      if (mode === 'edit' && topic) {
        const currentTopicResult = await getTopicById(topic.id);
        const currentTopicPosts =
          currentTopicResult.success && currentTopicResult.data ? currentTopicResult.data.topicPosts || [] : [];

        const currentPostIds = new Set(currentTopicPosts.map((tp) => tp.postId));
        const newPostIds = new Set(selectedPosts.map((p) => p.postId));

        // 添加新文章
        for (const { postId, sortOrder } of selectedPosts) {
          if (!currentPostIds.has(postId)) {
            await addPostToTopic(topicId, postId, sortOrder);
          }
        }

        // 删除移除的文章
        for (const tp of currentTopicPosts) {
          if (!newPostIds.has(tp.postId)) {
            await removePostFromTopic(topicId, tp.postId);
          }
        }
      } else {
        // 创建模式：直接添加所有选中的文章
        for (const { postId, sortOrder } of selectedPosts) {
          await addPostToTopic(topicId, postId, sortOrder);
        }
      }

      // 更新排序（如果有选中的文章）
      if (selectedPosts.length > 0) {
        await updateTopicPostSortOrder(topicId, selectedPosts);
      }

      showToast(mode === 'create' ? '创建成功' : '更新成功', 'success');
      onSuccess();
    } catch (error) {
      console.error('保存失败:', error);
      showToast('保存失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    // 表单状态
    name,
    setName,
    description,
    setDescription,
    coverImage,
    coverImageError,
    isPinned,
    setIsPinned,
    isHidden,
    setIsHidden,
    allPosts,
    selectedPosts,
    loading,
    // 方法
    handleCoverImageChange,
    handleImageError,
    handlePostToggle,
    handlePostReorder,
    handleBatchAddPosts,
    handleSubmit,
  };
}
