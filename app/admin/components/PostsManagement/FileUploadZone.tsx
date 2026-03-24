'use client';

import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';

interface FileUploadZoneProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  dropZoneRef: React.RefObject<HTMLDivElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onCreateClick: () => void;
}

/**
 * 文件上传区域组件
 */
export function FileUploadZone({
  fileInputRef,
  dropZoneRef,
  onFileSelect,
  onDrop,
  onDragOver,
  onCreateClick,
}: FileUploadZoneProps) {
  return (
    <Card
      ref={dropZoneRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
      className="mb-4 border-2 border-dashed border-border bg-card transition-colors hover:border-primary/50 sm:mb-8"
    >
      <CardContent className="p-4 text-center sm:p-8">
        <input ref={fileInputRef} type="file" accept=".md" onChange={onFileSelect} className="hidden" />
        <p className="text-muted-foreground mb-3 text-sm sm:mb-4 sm:text-base">
          拖拽 Markdown 文件到这里创建新文章，或
          <Button type="button" variant="link" className="h-auto px-1 py-0" onClick={onCreateClick}>
            点击选择文件
          </Button>
        </p>
      </CardContent>
    </Card>
  );
}
