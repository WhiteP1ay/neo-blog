'use client';

import { useState, useEffect } from 'react';
import { createTool, updateTool } from '@/server/actions/tools';
import { useToast } from '@/app/components/Toast';
import type { Tool } from '@/server/actions/tools';

interface UseToolFormProps {
  tool: Tool | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export function useToolForm({ tool, mode, onSuccess }: UseToolFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageError, setCoverImageError] = useState(false);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // 加载工具数据（编辑模式）
  useEffect(() => {
    if (mode === 'edit' && tool) {
      setName(tool.name);
      setDescription(tool.description || '');
      setCoverImage(tool.coverImage);
      setUrl(tool.url);
      setIsHidden(tool.isHidden);
    }
  }, [mode, tool]);

  // 验证 URL 是否有效
  const isValidUrl = (urlString: string): boolean => {
    if (!urlString || urlString.trim() === '') return false;
    try {
      new URL(urlString.trim());
      return true;
    } catch {
      return false;
    }
  };

  // 处理封面图 URL 输入
  const handleCoverImageChange = (urlString: string) => {
    const trimmedUrl = urlString.trim();
    if (trimmedUrl === '') {
      setCoverImage(null);
      setCoverImageError(false);
      return;
    }

    if (isValidUrl(trimmedUrl)) {
      setCoverImage(trimmedUrl);
      setCoverImageError(false);
    } else {
      setCoverImage(trimmedUrl);
      setCoverImageError(true);
    }
  };

  // 处理工具链接 URL 输入
  const handleUrlChange = (urlString: string) => {
    const trimmedUrl = urlString.trim();
    setUrl(trimmedUrl);
    if (trimmedUrl === '') {
      setUrlError(true);
    } else {
      setUrlError(!isValidUrl(trimmedUrl));
    }
  };

  // 处理图片加载错误
  const handleImageError = () => {
    setCoverImageError(true);
  };

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('请输入工具名称', 'error');
      return;
    }
    if (!url.trim()) {
      showToast('请输入工具链接URL', 'error');
      return;
    }
    if (!isValidUrl(url.trim())) {
      showToast('工具链接URL格式无效', 'error');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const result = await createTool({
          name: name.trim(),
          description: description.trim() || null,
          coverImage,
          url: url.trim(),
          isHidden,
        });

        if (!result.success) {
          showToast(`创建失败: ${result.error}`, 'error');
          setLoading(false);
          return;
        }
      } else {
        if (!tool) return;

        const result = await updateTool(tool.id, {
          name: name.trim(),
          description: description.trim() || null,
          coverImage,
          url: url.trim(),
          isHidden,
        });

        if (!result.success) {
          showToast(`更新失败: ${result.error}`, 'error');
          setLoading(false);
          return;
        }
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
    url,
    urlError,
    isHidden,
    setIsHidden,
    loading,
    // 方法
    handleCoverImageChange,
    handleUrlChange,
    handleImageError,
    handleSubmit,
  };
}
