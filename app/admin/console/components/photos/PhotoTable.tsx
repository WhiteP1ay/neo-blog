'use client';

import { useMemo, useState } from 'react';
import type { PhotoItem } from '../../types';

type PhotoTableProps = {
  photos: PhotoItem[];
  setPreview: (value: { title: string; url: string } | null) => void;
  togglePhotoHidden: (item: PhotoItem) => Promise<void>;
  deletePhoto: (id: number) => Promise<void>;
};

export function PhotoTable({ photos, setPreview, togglePhotoHidden, deletePhoto }: PhotoTableProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const types = useMemo(
    () => Array.from(new Set(photos.map((photo) => photo.type))).sort((a, b) => a.localeCompare(b)),
    [photos],
  );
  const visiblePhotos = useMemo(() => {
    if (selectedTypes.length === 0) return photos;
    return photos.filter((photo) => selectedTypes.includes(photo.type));
  }, [photos, selectedTypes]);

  const toggleType = (type: string) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  };

  return (
    <div className="space-y-3">
      <div className="rounded border p-3">
        <p className="mb-2 text-xs text-muted-foreground">按类型筛选（不选=全部）</p>
        <div className="flex flex-wrap gap-3">
          {types.map((type) => (
            <label key={type || '__empty'} className="inline-flex items-center gap-1 text-sm">
              <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} />
              {type || '(空)'}
            </label>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">标题</th>
              <th className="px-3 py-2">类型</th>
              <th className="px-3 py-2">状态</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {visiblePhotos.map((photo) => (
              <tr key={photo.id} className="border-b">
                <td className="px-3 py-2">{photo.id}</td>
                <td className="px-3 py-2">{photo.title}</td>
                <td className="px-3 py-2">{photo.type || '(空)'}</td>
                <td className="px-3 py-2">{photo.isHidden ? '隐藏' : '显示'}</td>
                <td className="px-3 py-2">
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
                    <button className="rounded border px-2 py-1" type="button" onClick={() => void togglePhotoHidden(photo)}>
                      切换显示
                    </button>
                    <button className="rounded border px-2 py-1" type="button" onClick={() => void deletePhoto(photo.id)}>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
