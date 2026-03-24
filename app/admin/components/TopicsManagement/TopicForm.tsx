'use client';

import Image from 'next/image';
import type { Topic } from '@/server/actions/topics';
import { useTopicForm } from './hooks/useTopicForm';
import { SortablePostList } from './components/SortablePostList';
import { BatchUploadZone } from './components/BatchUploadZone';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';

interface TopicFormProps {
  topic: Topic | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * 专题表单组件（创建/编辑）
 */
export function TopicForm({ topic, mode, onSuccess, onCancel }: TopicFormProps) {
  const {
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
    handleCoverImageChange,
    handleImageError,
    handlePostToggle,
    handlePostReorder,
    handleBatchAddPosts,
    handleSubmit,
  } = useTopicForm({ topic, mode, onSuccess });

  return (
    <div>
      <div className="mb-4">
        <Button variant="link" className="h-auto p-0 text-primary" onClick={onCancel}>
          ← 返回列表
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{mode === 'create' ? '创建专题' : '编辑专题'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic-name">
                专题名称 <span className="text-destructive">*</span>
              </Label>
              <Input id="topic-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic-desc">专题描述（可选）</Label>
              <Textarea
                id="topic-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="请输入专题描述..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic-cover">封面图 URL（可选）</Label>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <Input
                    id="topic-cover"
                    type="url"
                    value={coverImage || ''}
                    onChange={(e) => handleCoverImageChange(e.target.value)}
                    placeholder="请输入图片 URL，例如：https://example.com/image.jpg"
                    className={coverImageError && coverImage ? 'border-destructive' : ''}
                  />
                  {coverImageError && coverImage ? (
                    <p className="text-destructive text-xs">URL 格式无效，请输入完整的图片地址</p>
                  ) : null}
                </div>
                {coverImage && !coverImageError ? (
                  <div className="shrink-0">
                    <Image
                      src={coverImage}
                      alt="封面图预览"
                      width={150}
                      height={150}
                      className="rounded-lg border border-border object-cover"
                      onError={handleImageError}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="topic-pinned" checked={isPinned} onCheckedChange={(v) => setIsPinned(v === true)} />
              <Label htmlFor="topic-pinned" className="font-medium">
                置顶
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="topic-hidden" checked={isHidden} onCheckedChange={(v) => setIsHidden(v === true)} />
              <Label htmlFor="topic-hidden" className="font-medium">
                隐藏
              </Label>
            </div>

            <div className="space-y-2">
              <Label>批量上传文章</Label>
              <BatchUploadZone onFilesUploaded={handleBatchAddPosts} />
            </div>

            <div className="space-y-2">
              <Label>文章管理</Label>
              <div className="max-h-96 overflow-y-auto rounded-md border border-border p-4">
                {allPosts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">暂无文章</p>
                ) : (
                  <div className="space-y-2">
                    {allPosts.map((post) => {
                      const isSelected = selectedPosts.some((p) => p.postId === post.id);
                      return (
                        <label
                          key={post.id}
                          htmlFor={`post-${post.id}`}
                          className="hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-md p-2"
                        >
                          <Checkbox
                            id={`post-${post.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handlePostToggle(post.id)}
                          />
                          <span className="flex-1 text-sm">{post.title}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <SortablePostList
                posts={selectedPosts}
                allPosts={allPosts}
                onReorder={handlePostReorder}
                onRemove={handlePostToggle}
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : mode === 'create' ? '创建' : '更新'}
              </Button>
              <Button type="button" variant="secondary" onClick={onCancel}>
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
