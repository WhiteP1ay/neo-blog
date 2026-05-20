'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ZenPostEditor } from '@/components/admin/ZenPostEditor';
import type { PostDetail, PostTypeAdminRow } from '@/components/admin/console/types';

export default function AdminPostZenEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rawId = params.id;
  const postId = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : Number.NaN;

  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [postTypes, setPostTypes] = useState<PostTypeAdminRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isFinite(postId) || postId <= 0) {
      setError('无效文章 ID');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [detailRes, typesRes] = await Promise.all([
          fetch(`/api/admin/posts/${postId}`),
          fetch('/api/admin/post-types'),
        ]);
        const typesPayload = (await typesRes.json()) as { data?: PostTypeAdminRow[]; error?: string };
        if (!typesRes.ok || !typesPayload.data) {
          throw new Error(typesPayload.error ?? '加载类型失败');
        }
        const payload = (await detailRes.json()) as { data?: PostDetail; error?: string };
        if (!detailRes.ok) {
          throw new Error(payload.error ?? '加载失败');
        }
        if (!payload.data) {
          throw new Error('未取到文章详情');
        }
        if (!cancelled) {
          setPostTypes(typesPayload.data);
          setDetail(payload.data);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (!Number.isFinite(postId) || postId <= 0) {
    return <p className="p-4 text-sm text-destructive">{error || '无效文章 ID'}</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-destructive">{error}</p>;
  }

  if (!detail) {
    return <p className="p-4 text-sm text-muted-foreground">加载中…</p>;
  }

  return (
    <ZenPostEditor
      mode="edit"
      presentation="page"
      open
      postId={postId}
      availableTypes={postTypes}
      initialTypeIds={detail.types.map((t) => t.id)}
      initialContent={detail.content}
      initialContentEn={detail.contentEn ?? ''}
      isHidden={detail.isHidden}
      excerpt={detail.excerpt ?? ''}
      coverUrl={detail.coverUrl ?? ''}
      onClose={() => router.push('/admin/posts')}
      onSaved={() => {
        router.refresh();
        void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      }}
      onDeleted={() => router.push('/admin/posts')}
    />
  );
}
