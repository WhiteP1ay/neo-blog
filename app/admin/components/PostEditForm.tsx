'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updatePost, type Post } from '@/server/actions/posts';
import { getTopics, getTopicsByPostId, addPostToTopic, removePostFromTopic, type Topic } from '@/server/actions/topics';
import { useToast } from '@/app/components/Toast';
import Link from 'next/link';

interface PostEditFormProps {
  post: Post;
}

/**
 * 文章编辑表单组件
 * 用于编辑文章的元数据（标题、创建日期、修改日期等）
 */
export function PostEditForm({ post }: PostEditFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    title: post.title,
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString().slice(0, 16) : '', // 格式：YYYY-MM-DDTHH:mm
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString().slice(0, 16) : '',
  });

  // 加载专题数据
  useEffect(() => {
    const loadTopics = async () => {
      const topicsResult = await getTopics(true); // 包含隐藏的专题
      if (topicsResult.success && topicsResult.data) {
        setAllTopics(topicsResult.data);
      }

      // 加载文章当前所属的专题
      const postTopicsResult = await getTopicsByPostId(post.id);
      if (postTopicsResult.success && postTopicsResult.data) {
        setSelectedTopicIds(postTopicsResult.data.map((t) => t.id));
      }
    };
    loadTopics();
  }, [post.id]);

  /**
   * 处理专题选择
   */
  const handleTopicToggle = (topicId: number) => {
    setSelectedTopicIds((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((id) => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 更新文章基本信息
      const result = await updatePost(post.id, {
        title: formData.title,
        createdAt: formData.createdAt ? new Date(formData.createdAt) : null,
        updatedAt: formData.updatedAt ? new Date(formData.updatedAt) : null,
      });

      if (!result.success) {
        showToast(`更新失败: ${result.error}`, 'error');
        setLoading(false);
        return;
      }

      // 更新专题关联
      const currentTopicsResult = await getTopicsByPostId(post.id);
      const currentTopicIds =
        currentTopicsResult.success && currentTopicsResult.data
          ? new Set(currentTopicsResult.data.map((t) => t.id))
          : new Set<number>();

      const newTopicIds = new Set(selectedTopicIds);

      // 添加新专题
      for (const topicId of selectedTopicIds) {
        if (!currentTopicIds.has(topicId)) {
          await addPostToTopic(topicId, post.id);
        }
      }

      // 移除专题
      for (const topicId of currentTopicIds) {
        if (!newTopicIds.has(topicId)) {
          await removePostFromTopic(topicId, post.id);
        }
      }

      showToast('文章更新成功', 'success');
      router.push('/admin');
      router.refresh(); // 刷新页面以更新列表
    } catch (error) {
      console.error('更新失败:', error);
      showToast('更新失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/admin" className="text-sm sm:text-base text-blue-600 hover:text-blue-800">
            ← 返回文章列表
          </Link>
        </div>

        {/* 编辑表单 */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">编辑文章元数据</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 标题 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                标题 *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                required
              />
            </div>

            {/* 创建日期 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="createdAt" className="block text-sm font-medium text-gray-700">
                  创建日期
                </label>
                {formData.createdAt && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, createdAt: '' }))}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    清空
                  </button>
                )}
              </div>
              <input
                type="datetime-local"
                id="createdAt"
                value={formData.createdAt}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    createdAt: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            {/* 修改日期 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="updatedAt" className="block text-sm font-medium text-gray-700">
                  修改日期
                </label>
                {formData.updatedAt && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, updatedAt: '' }))}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    清空
                  </button>
                )}
              </div>
              <input
                type="datetime-local"
                id="updatedAt"
                value={formData.updatedAt}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    updatedAt: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            {/* 专题选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">所属专题（可多选）</label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                {allTopics.length === 0 ? (
                  <p className="text-sm text-gray-500">暂无专题</p>
                ) : (
                  <div className="space-y-2">
                    {allTopics.map((topic) => (
                      <label
                        key={topic.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTopicIds.includes(topic.id)}
                          onChange={() => handleTopicToggle(topic.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 flex-1">{topic.name}</span>
                        {topic.isPinned && <span className="text-xs text-yellow-600">置顶</span>}
                        {topic.isHidden && <span className="text-xs text-gray-400">隐藏</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 文章信息（只读） */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">文章ID:</span> {post.id}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">内容长度:</span> {post.content.length} 字符
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Markdown源文件:</span> {post.markdownContent ? '已保存' : '未保存'}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between pt-4">
              <Link href="/admin" className="text-sm sm:text-base text-gray-600 hover:text-gray-800">
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {loading ? '保存中...' : '保存更改'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
