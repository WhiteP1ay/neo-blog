'use client';

type PhotoCreateProps = {
  open: boolean;
  onClose: () => void;
  form: {
    newPhotoTitle: string;
    setNewPhotoTitle: (value: string) => void;
    newPhotoDesc: string;
    setNewPhotoDesc: (value: string) => void;
    newPhotoType: string;
    setNewPhotoType: (value: string) => void;
    newPhotoIsHidden: boolean;
    setNewPhotoIsHidden: (value: boolean) => void;
    photoUploadHint: string;
    createPhoto: () => Promise<void>;
    uploadPhotoFile: (file: File) => Promise<void>;
  };
};

export function PhotoCreate({ open, onClose, form }: PhotoCreateProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <button className="absolute inset-0 bg-black/70" type="button" aria-label="关闭新增照片弹窗" onClick={onClose} />
      <div className="relative w-full max-w-2xl space-y-3 rounded border bg-background p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">新增照片</h3>
          <button className="rounded border px-2 py-1 text-xs" type="button" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="space-y-2">
          <input className="w-full rounded border px-2 py-1" placeholder="照片标题" value={form.newPhotoTitle} onChange={(e) => form.setNewPhotoTitle(e.target.value)} />
          <input className="w-full rounded border px-2 py-1" placeholder="类型（默认空）" value={form.newPhotoType} onChange={(e) => form.setNewPhotoType(e.target.value)} />
          <textarea className="h-20 w-full rounded border px-2 py-1" placeholder="描述" value={form.newPhotoDesc} onChange={(e) => form.setNewPhotoDesc(e.target.value)} />
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={form.newPhotoIsHidden} onChange={(e) => form.setNewPhotoIsHidden(e.target.checked)} />
            隐藏
          </label>
          <button
            className="rounded border px-3 py-1"
            type="button"
            onClick={async () => {
              await form.createPhoto();
              onClose();
            }}
          >
            创建
          </button>
          <label
            className="block rounded border border-dashed p-3 text-sm text-muted-foreground"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) void form.uploadPhotoFile(file);
            }}
          >
            拖拽图片到这里上传
            <input
              type="file"
              accept="image/*"
              className="mt-2 block"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void form.uploadPhotoFile(file);
              }}
            />
          </label>
          {form.photoUploadHint ? <p className="text-xs text-muted-foreground">{form.photoUploadHint}</p> : null}
        </div>
      </div>
    </div>
  );
}
