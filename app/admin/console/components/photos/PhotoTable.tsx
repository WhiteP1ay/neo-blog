'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { encodeTopicPathSegment } from '@/lib/url/segmentEncoding';
import type { PhotoItem } from '../../types';

type PhotoTableProps = {
  photos: PhotoItem[];
  setPreviewPhotoId: (value: number | null) => void;
  togglePhotoHidden: (item: PhotoItem) => Promise<void>;
  deletePhoto: (id: number) => Promise<void>;
  /** 路径同步的类型筛选：null 或 undefined 表示显示全部 */
  selectedType?: string | null;
};

const ADMIN_PHOTOS_BASE = '/admin/photos';

export function PhotoTable({
  photos,
  setPreviewPhotoId,
  togglePhotoHidden,
  deletePhoto,
  selectedType = null,
}: PhotoTableProps) {
  const types = useMemo(
    () => Array.from(new Set(photos.map((photo) => photo.type))).sort((a, b) => a.localeCompare(b)),
    [photos],
  );
  const visiblePhotos = useMemo(() => {
    if (selectedType === null || selectedType === undefined) return photos;
    return photos.filter((photo) => photo.type === selectedType);
  }, [photos, selectedType]);

  const isFiltering = selectedType !== null && selectedType !== undefined;

  return (
    <div className="space-y-3">
      <div className="rounded border p-3">
        <p className="mb-2 text-xs text-muted-foreground">按类型筛选（路径同步，刷新保留）</p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={ADMIN_PHOTOS_BASE}
            scroll={false}
            className={`rounded border px-2 py-1 text-sm hover:bg-muted ${!isFiltering ? 'bg-muted font-medium' : ''}`}
            aria-current={!isFiltering ? 'page' : undefined}
          >
            全部
          </Link>
          {types.map((type) => {
            const active = isFiltering && selectedType === type;
            return (
              <Link
                key={type || '__empty'}
                href={`${ADMIN_PHOTOS_BASE}/type/${encodeTopicPathSegment(type)}`}
                scroll={false}
                className={`rounded border px-2 py-1 text-sm hover:bg-muted ${active ? 'bg-muted font-medium' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {type || '(空)'}
              </Link>
            );
          })}
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
                        setPreviewPhotoId(photo.id);
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
