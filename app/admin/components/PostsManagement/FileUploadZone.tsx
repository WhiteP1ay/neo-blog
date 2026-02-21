'use client';

interface FileUploadZoneProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  dropZoneRef: React.RefObject<HTMLDivElement>;
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
    // biome-ignore lint/a11y/noStaticElementInteractions: <todo>
    <div
      ref={dropZoneRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 mb-4 sm:mb-8 text-center hover:border-blue-400 transition-colors"
    >
      <input ref={fileInputRef} type="file" accept=".md" onChange={onFileSelect} className="hidden" />
      <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
        拖拽Markdown文件到这里创建新文章，或
        <button onClick={onCreateClick} className="text-blue-600 hover:text-blue-800 ml-1">
          点击选择文件
        </button>
      </p>
    </div>
  );
}
