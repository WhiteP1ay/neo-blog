'use client';

import { useState } from 'react';
import type { PhotoItem } from '../types';
import { useToast } from '@/components/Toast';
import { PhotoCreate } from './photos/PhotoCreate';
import { PhotoPreview } from './photos/PhotoPreview';
import { PhotoTable } from './photos/PhotoTable';

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

export function PhotosSection({ photos, form }: { photos: PhotoItem[]; form: PhotoFormState }) {
  const { showToast } = useToast();
  const [previewPhotoId, setPreviewPhotoId] = useState<number | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const previewIndex = photos.findIndex((photo) => photo.id === previewPhotoId);
  const previewPhoto = previewIndex >= 0 ? photos[previewIndex] : null;

  const goPrev = () => {
    if (photos.length === 0 || previewIndex < 0) return;
    const nextIndex = (previewIndex - 1 + photos.length) % photos.length;
    setPreviewPhotoId(photos[nextIndex].id);
  };

  const goNext = () => {
    if (photos.length === 0 || previewIndex < 0) return;
    const nextIndex = (previewIndex + 1) % photos.length;
    setPreviewPhotoId(photos[nextIndex].id);
  };

  const quickDeleteFromPreview = async (id: number) => {
    if (photos.length === 0) return;
    const currentIndex = photos.findIndex((photo) => photo.id === id);
    if (currentIndex < 0) return;
    if (photos.length <= 1) {
      try {
        await form.deletePhoto(id);
        showToast('删除成功', 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : '删除失败', 'error');
      }
      setPreviewPhotoId(null);
      return;
    }
    // 先切到下一张，避免删除当前导致预览瞬间关闭（列表刷新前会短暂缺图）。
    const nextIndex = currentIndex >= photos.length - 1 ? currentIndex - 1 : currentIndex + 1;
    setPreviewPhotoId(photos[nextIndex].id);
    try {
      await form.deletePhoto(id);
      showToast('删除成功', 'success');
    } catch (error) {
      // 删除失败：尽量切回原图
      setPreviewPhotoId(id);
      showToast(error instanceof Error ? error.message : '删除失败', 'error');
    }
  };

  return (
    <section className="space-y-3 rounded border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">照片管理</h2>
        <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setOpenCreate(true)}>
          新增照片
        </button>
      </div>
      <PhotoTable
        photos={photos}
        setPreviewPhotoId={setPreviewPhotoId}
        togglePhotoHidden={form.togglePhotoHidden}
        deletePhoto={form.deletePhoto}
      />
      <PhotoCreate open={openCreate} onClose={() => setOpenCreate(false)} form={form} />
      <PhotoPreview
        preview={
          previewPhoto?.coverUrl
            ? {
                id: previewPhoto.id,
                title: previewPhoto.title,
                url: previewPhoto.coverUrl,
                index: previewIndex,
                total: photos.length,
              }
            : null
        }
        onClose={() => setPreviewPhotoId(null)}
        onPrev={goPrev}
        onNext={goNext}
        onDelete={quickDeleteFromPreview}
      />
    </section>
  );
}
