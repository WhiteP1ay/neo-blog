'use client';

import { useState } from 'react';
import type { PhotoItem } from '../types';

type PhotoFormState = {
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
  togglePhotoHidden: (item: PhotoItem) => Promise<void>;
  deletePhoto: (id: number) => Promise<void>;
};

/**
 * 照片管理面板：创建、图片上传、列表操作。
 */
export function PhotosPanel({ photos, form }: { photos: PhotoItem[]; form: PhotoFormState }) {
  const [preview, setPreview] = useState<{ title: string; url: string } | null>(null);

  return (
    <section className="space-y-3 rounded border p-4">
      <h2 className="text-lg font-semibold">新增照片</h2>
      <div className="space-y-2">
        <input className="w-full rounded border px-2 py-1" placeholder="照片标题" value={form.newPhotoTitle} onChange={(e) => form.setNewPhotoTitle(e.target.value)} />
        <input className="w-full rounded border px-2 py-1" placeholder="类型（默认空）" value={form.newPhotoType} onChange={(e) => form.setNewPhotoType(e.target.value)} />
        <textarea className="h-20 w-full rounded border px-2 py-1" placeholder="描述" value={form.newPhotoDesc} onChange={(e) => form.setNewPhotoDesc(e.target.value)} />
        <label className="inline-flex items-center gap-1">
          <input type="checkbox" checked={form.newPhotoIsHidden} onChange={(e) => form.setNewPhotoIsHidden(e.target.checked)} />
          隐藏
        </label>
        <button className="rounded border px-3 py-1" type="button" onClick={() => void form.createPhoto()}>
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
      <ul className="space-y-2">
        {photos.map((photo) => (
          <li key={photo.id} className="flex items-center justify-between rounded border p-2">
            <span>
              #{photo.id} {photo.title} type={photo.type || '(空)'} {photo.isHidden ? '[隐藏]' : '[显示]'}
            </span>
            <div className="flex gap-2">
              <button
                className="rounded border px-2 py-1"
                type="button"
                disabled={!photo.coverUrl}
                onClick={() => {
                  if (!photo.coverUrl) return;
                  setPreview({ title: photo.title, url: photo.coverUrl });
                }}
                title={photo.coverUrl ? '预览图片' : '没有可预览的图片 URL'}
              >
                预览
              </button>
              <button className="rounded border px-2 py-1" type="button" onClick={() => void form.togglePhotoHidden(photo)}>
                切换显示
              </button>
              <button className="rounded border px-2 py-1" type="button" onClick={() => void form.deletePhoto(photo.id)}>
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            className="absolute inset-0 bg-black/70"
            type="button"
            aria-label="关闭预览"
            onClick={() => setPreview(null)}
          />
          <div className="relative w-full max-w-5xl space-y-2 rounded border bg-background p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{preview.title}</p>
              <button className="rounded border px-2 py-1 text-xs" type="button" onClick={() => setPreview(null)}>
                关闭
              </button>
            </div>
            {/* biome-ignore lint/performance/noImgElement: 预览使用动态 OSS 外链，避免 next/image 域名配置耦合 */}
            <img src={preview.url} alt={preview.title} className="max-h-[75vh] w-full rounded object-contain" />
          </div>
        </div>
      ) : null}
    </section>
  );
}
