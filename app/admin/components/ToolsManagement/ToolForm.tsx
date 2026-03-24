'use client';

import Image from 'next/image';
import type { Tool } from '@/server/actions/tools';
import { useToolForm } from './hooks/useToolForm';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';

interface ToolFormProps {
  tool: Tool | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * 工具表单组件（创建/编辑）
 */
export function ToolForm({ tool, mode, onSuccess, onCancel }: ToolFormProps) {
  const {
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
    handleCoverImageChange,
    handleUrlChange,
    handleImageError,
    handleSubmit,
  } = useToolForm({ tool, mode, onSuccess });

  return (
    <div>
      <div className="mb-4">
        <Button variant="link" className="h-auto p-0 text-primary" onClick={onCancel}>
          ← 返回列表
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{mode === 'create' ? '创建工具' : '编辑工具'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tool-name">
                工具名称 <span className="text-destructive">*</span>
              </Label>
              <Input id="tool-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-desc">工具描述（可选）</Label>
              <Textarea
                id="tool-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="请输入工具描述..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-url">
                工具链接URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tool-url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={urlError && url ? 'border-destructive' : ''}
                placeholder="https://example.com/tool"
                required
              />
              {urlError && url ? <p className="text-destructive text-xs">URL 格式无效，请输入完整的链接地址</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-cover">封面图 URL（可选）</Label>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <Input
                    id="tool-cover"
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
              <Checkbox id="tool-hidden" checked={isHidden} onCheckedChange={(v) => setIsHidden(v === true)} />
              <Label htmlFor="tool-hidden" className="font-medium">
                隐藏
              </Label>
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
