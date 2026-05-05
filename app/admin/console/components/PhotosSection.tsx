'use client';

import { useState } from 'react';
import type { PhotoItem } from '../types';
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
  const [preview, setPreview] = useState<{ title: string; url: string } | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

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
        setPreview={setPreview}
        togglePhotoHidden={form.togglePhotoHidden}
        deletePhoto={form.deletePhoto}
      />
      <PhotoCreate open={openCreate} onClose={() => setOpenCreate(false)} form={form} />
      <PhotoPreview preview={preview} onClose={() => setPreview(null)} />
    </section>
  );
}
