'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ZenPostEditor } from '@/components/admin/ZenPostEditor';
import type { PostDetail } from '@/components/admin/console/types';

export default function AdminPostZenEditPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const postId = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : Number.NaN;

  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(postId) || postId <= 0) {
      setError('无效文章 ID');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/posts/${postId}`);
        const payload = (await res.json()) as { data?: PostDetail; error?: string };
        if (!res.ok) {
          throw new Error(payload.error ?? '加载失败');
        }
        if (!payload.data) {
          throw new Error('未取到文章详情');
        }
        if (!cancelled) setDetail(payload.data);
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
      open={open}
      postId={postId}
      initialTitle={detail.title}
      initialType={detail.type ?? ''}
      initialContent={detail.content}
      isHidden={detail.isHidden}
      excerpt={detail.excerpt ?? ''}
      coverUrl={detail.coverUrl ?? ''}
      onClose={() => {
        setOpen(false);
        router.push('/admin/posts');
      }}
      onSaved={() => {
        router.refresh();
      }}
      onDeleted={() => {
        setOpen(false);
        router.push('/admin/posts');
      }}
    />
  );
}
