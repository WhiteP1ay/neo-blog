import { AdminConsole } from '@/app/admin/AdminConsole';
import { decodeTopicPathSegment } from '@/lib/url/segmentEncoding';

type PageProps = {
  params: Promise<{ type: string }>;
};

/**
 * 按类型筛选照片列表；`/admin/photos` 为全部，本页为单选筛选（路径可刷新保留）。
 */
export default async function AdminPhotosByTypePage({ params }: PageProps) {
  const { type: rawSegment } = await params;
  const selectedType = decodeTopicPathSegment(rawSegment);
  return <AdminConsole initialTab="photos" showTabNav={false} photosSelectedType={selectedType} />;
}
