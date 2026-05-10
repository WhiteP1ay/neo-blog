'use client';

type PhotoPreviewProps = {
  preview: { id: number; title: string; url: string; index: number; total: number } | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDelete: (id: number) => Promise<void>;
};

export function PhotoPreview({ preview, onClose, onPrev, onNext, onDelete }: PhotoPreviewProps) {
  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button className="absolute inset-0 bg-black/70" type="button" aria-label="关闭预览" onClick={onClose} />
      <div className="relative w-full max-w-5xl space-y-2 rounded border bg-background p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {preview.title}（{preview.index + 1}/{preview.total}）
          </p>
          <div className="flex gap-2">
            <button className="rounded border px-2 py-1 text-xs" type="button" onClick={onPrev}>
              上一张
            </button>
            <button className="rounded border px-2 py-1 text-xs" type="button" onClick={onNext}>
              下一张
            </button>
            <button
              className="rounded border px-2 py-1 text-xs text-red-500"
              type="button"
              onClick={() => void onDelete(preview.id)}
            >
              删除
            </button>
            <button className="rounded border px-2 py-1 text-xs" type="button" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>
        {/* biome-ignore lint/performance/noImgElement: 预览使用动态 OSS 外链，避免 next/image 域名配置耦合 */}
        <img src={preview.url} alt={preview.title} className="max-h-[75vh] w-full rounded object-contain" />
      </div>
    </div>
  );
}
