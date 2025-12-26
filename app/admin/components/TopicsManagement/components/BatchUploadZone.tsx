"use client";

import { useRef } from "react";
import { useToast } from "@/app/components/Toast";

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
    const mdFiles = Array.from(files).filter((file) => file.name.endsWith(".md"));

    if (mdFiles.length === 0) {
      showToast("请选择.md文件", "warning");
      return;
    }

    const postIds: number[] = [];

    for (const file of mdFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (result.success && result.data?.id) {
          postIds.push(result.data.id);
        }
      } catch (error) {
        console.error("上传失败:", error);
      }
    }

    if (postIds.length > 0) {
      showToast(`成功上传 ${postIds.length} 篇文章`, "success");
      onFilesUploaded(postIds);
    } else {
      showToast("上传失败", "error");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    e.target.value = "";
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
    <div
      ref={dropZoneRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 text-center hover:border-blue-400 transition-colors"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <p className="text-sm text-gray-600 mb-2">
        批量上传 Markdown 文件添加文章到专题
      </p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-blue-600 hover:text-blue-800 text-sm"
      >
        点击选择文件
      </button>
      <span className="text-sm text-gray-500 mx-2">或</span>
      <span className="text-sm text-gray-500">拖拽文件到这里</span>
    </div>
  );
}

