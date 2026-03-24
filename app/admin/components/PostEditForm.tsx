'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updatePost, type Post } from '@/server/actions/posts';
import { getTopics, getTopicsByPostId, addPostToTopic, removePostFromTopic, type Topic } from '@/server/actions/topics';
import { useToast } from '@/app/components/Toast';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

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
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-6">
          <Button variant="link" className="h-auto p-0 text-primary" asChild>
            <Link href="/admin">← 返回文章列表</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">编辑文章元数据</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="createdAt">创建日期</Label>
                  {formData.createdAt ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-auto px-2 py-0 text-xs"
                      onClick={() => setFormData((prev) => ({ ...prev, createdAt: '' }))}
                    >
                      清空
                    </Button>
                  ) : null}
                </div>
                <Input
                  type="datetime-local"
                  id="createdAt"
                  value={formData.createdAt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      createdAt: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="updatedAt">修改日期</Label>
                  {formData.updatedAt ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-auto px-2 py-0 text-xs"
                      onClick={() => setFormData((prev) => ({ ...prev, updatedAt: '' }))}
                    >
                      清空
                    </Button>
                  ) : null}
                </div>
                <Input
                  type="datetime-local"
                  id="updatedAt"
                  value={formData.updatedAt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      updatedAt: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>所属专题（可多选）</Label>
                <div className="max-h-48 overflow-y-auto rounded-md border border-border p-4">
                  {allTopics.length === 0 ? (
                    <p className="text-muted-foreground text-sm">暂无专题</p>
                  ) : (
                    <div className="space-y-2">
                      {allTopics.map((topic) => (
                        <label
                          key={topic.id}
                          htmlFor={`topic-${topic.id}`}
                          className="hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-md p-2"
                        >
                          <Checkbox
                            id={`topic-${topic.id}`}
                            checked={selectedTopicIds.includes(topic.id)}
                            onCheckedChange={() => handleTopicToggle(topic.id)}
                          />
                          <span className="flex-1 text-sm">{topic.name}</span>
                          {topic.isPinned ? (
                            <span className="text-xs text-amber-600 dark:text-amber-400">置顶</span>
                          ) : null}
                          {topic.isHidden ? <span className="text-muted-foreground text-xs">隐藏</span> : null}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/50 space-y-2 rounded-lg p-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">文章ID:</span> {post.id}
                </div>
                <div>
                  <span className="font-medium text-foreground">内容长度:</span> {post.content.length} 字符
                </div>
                <div>
                  <span className="font-medium text-foreground">Markdown源文件:</span>{' '}
                  {post.markdownContent ? '已保存' : '未保存'}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" asChild>
                  <Link href="/admin">取消</Link>
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '保存中...' : '保存更改'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
