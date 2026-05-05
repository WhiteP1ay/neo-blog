'use client';

type PhotoPreviewProps = {
  preview: { title: string; url: string } | null;
  onClose: () => void;
};

export function PhotoPreview({ preview, onClose }: PhotoPreviewProps) {
  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button className="absolute inset-0 bg-black/70" type="button" aria-label="关闭预览" onClick={onClose} />
      <div className="relative w-full max-w-5xl space-y-2 rounded border bg-background p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{preview.title}</p>
          <button className="rounded border px-2 py-1 text-xs" type="button" onClick={onClose}>
            关闭
          </button>
        </div>
        {/* biome-ignore lint/performance/noImgElement: 预览使用动态 OSS 外链，避免 next/image 域名配置耦合 */}
        <img src={preview.url} alt={preview.title} className="max-h-[75vh] w-full rounded object-contain" />
      </div>
    </div>
  );
}
