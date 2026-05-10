'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
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

const actionBtnClass = 'min-h-10 touch-manipulation rounded border px-3 py-2 text-sm sm:min-h-0 sm:px-2 sm:py-1';

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
            className={`min-h-10 touch-manipulation rounded border px-3 py-2 text-sm leading-none hover:bg-muted sm:min-h-0 sm:px-2 sm:py-1 ${!isFiltering ? 'bg-muted font-medium' : ''}`}
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
                className={`min-h-10 touch-manipulation rounded border px-3 py-2 text-sm leading-none hover:bg-muted sm:min-h-0 sm:px-2 sm:py-1 ${active ? 'bg-muted font-medium' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {type || '(空)'}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {visiblePhotos.map((photo) => {
          const switchId = `photo-visible-${photo.id}`;
          return (
            <div key={photo.id} className="rounded-lg border bg-card p-3 shadow-sm">
              <div className="flex gap-3">
                {photo.coverUrl ? (
                  <button
                    type="button"
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted"
                    onClick={() => setPreviewPhotoId(photo.id)}
                    title="预览图片"
                  >
                    {/* biome-ignore lint/performance/noImgElement: coverUrl 可能为任意外链，与 PhotoPreview 一致 */}
                    <img src={photo.coverUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                    无图
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="wrap-break-word font-medium leading-snug">{photo.title}</p>
                  <p className="text-xs text-muted-foreground">
                    ID {photo.id} · {photo.type || '(空)'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      id={switchId}
                      checked={!photo.isHidden}
                      onCheckedChange={() => void togglePhotoHidden(photo)}
                      aria-label="前台显示"
                    />
                    <label htmlFor={switchId} className="cursor-pointer select-none text-xs text-muted-foreground">
                      前台显示
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className={actionBtnClass}
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
                <button className={actionBtnClass} type="button" onClick={() => void deletePhoto(photo.id)}>
                  删除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">标题</th>
              <th className="px-3 py-2">类型</th>
              <th className="px-3 py-2">前台显示</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {visiblePhotos.map((photo) => {
              const switchId = `photo-row-visible-${photo.id}`;
              return (
                <tr key={photo.id} className="border-b">
                  <td className="px-3 py-2">{photo.id}</td>
                  <td className="px-3 py-2">{photo.title}</td>
                  <td className="px-3 py-2">{photo.type || '(空)'}</td>
                  <td className="px-3 py-2">
                    <Switch
                      id={switchId}
                      checked={!photo.isHidden}
                      onCheckedChange={() => void togglePhotoHidden(photo)}
                      aria-label="前台显示"
                    />
                  </td>
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
                      <button
                        className="rounded border px-2 py-1"
                        type="button"
                        onClick={() => void deletePhoto(photo.id)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
