'use client';

import { useRef } from 'react';
import { useToast } from '@/app/components/Toast';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';

interface BatchUploadZoneProps {
  onFilesUploaded: (postIds: number[]) => void;
}

/**
 * 批量上传区域组件（用于专题批量添加文章）
 */
export function BatchUploadZone({ onFilesUploaded }: BatchUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const handleFileUpload = async (files: FileList) => {
    const mdFiles = Array.from(files).filter((file) => file.name.endsWith('.md'));

    if (mdFiles.length === 0) {
      showToast('请选择.md文件', 'warning');
      return;
    }

    const postIds: number[] = [];

    for (const file of mdFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success && result.data?.id) {
          postIds.push(result.data.id);
        }
      } catch (error) {
        console.error('上传失败:', error);
      }
    }

    if (postIds.length > 0) {
      showToast(`成功上传 ${postIds.length} 篇文章`, 'success');
      onFilesUploaded(postIds);
    } else {
      showToast('上传失败', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card
      ref={dropZoneRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-border bg-card transition-colors hover:border-primary/50"
    >
      <CardContent className="space-y-2 p-4 text-center">
        <input ref={fileInputRef} type="file" accept=".md" multiple onChange={handleFileSelect} className="hidden" />
        <p className="text-muted-foreground text-sm">批量上传 Markdown 文件添加文章到专题</p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <Button type="button" variant="link" className="h-auto p-0" onClick={() => fileInputRef.current?.click()}>
            点击选择文件
          </Button>
          <span className="text-muted-foreground">或</span>
          <span className="text-muted-foreground">拖拽文件到这里</span>
        </div>
      </CardContent>
    </Card>
  );
}
