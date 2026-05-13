'use client';

import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { ZenPostEditor } from '@/components/admin/ZenPostEditor';
import type { PostTypeAdminRow } from '@/components/admin/console/types';

type EditDetail = {
  postId: number;
  initialTypeIds: number[];
  initialContent: string;
  initialContentEn: string;
  isHidden: boolean;
  excerpt: string;
  coverUrl: string;
};

type AdminPostEditEntryProps = {
  postId: number;
  className?: string;
};

/**
 * c 端文章列表 / 详情页给管理员准备的「编辑入口」
 */
export function AdminPostEditEntry({ postId, className }: AdminPostEditEntryProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<EditDetail | null>(null);
  const [availableTypes, setAvailableTypes] = useState<PostTypeAdminRow[]>([]);

  const openEditor = async () => {
    if (loading || detail) return;
    setLoading(true);
    try {
      const [detailRes, typesRes] = await Promise.all([
        fetch(`/api/admin/posts/${postId}`, { credentials: 'same-origin' }),
        fetch('/api/admin/post-types', { credentials: 'same-origin' }),
      ]);
      const typesPayload = (await typesRes.json()) as { data?: PostTypeAdminRow[]; error?: string };
      if (!typesRes.ok || !typesPayload.data) {
        throw new Error(typesPayload.error ?? '加载类型列表失败');
      }
      setAvailableTypes(typesPayload.data);

      const payload = (await detailRes.json()) as {
        data?: {
          title?: string;
          types?: Array<{ id: number }>;
          content?: string;
          contentEn?: string | null;
          isHidden?: boolean;
          excerpt?: string | null;
          coverUrl?: string | null;
        };
        error?: string;
      };
      if (!detailRes.ok || !payload.data) {
        throw new Error(payload.error ?? '加载文章详情失败');
      }
      const d = payload.data;
      setDetail({
        postId,
        initialTypeIds: (d.types ?? []).map((t) => t.id),
        initialContent: d.content ?? '',
        initialContentEn: d.contentEn ?? '',
        isHidden: d.isHidden === true,
        excerpt: d.excerpt ?? '',
        coverUrl: d.coverUrl ?? '',
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : '打开编辑器失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void openEditor();
        }}
        disabled={loading}
        className={`inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:opacity-60 ${className ?? ''}`.trim()}
        aria-label="编辑文章"
        title="编辑文章"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {detail ? (
        <ZenPostEditor
          mode="edit"
          open
          postId={detail.postId}
          availableTypes={availableTypes}
          initialTypeIds={detail.initialTypeIds}
          initialContent={detail.initialContent}
          initialContentEn={detail.initialContentEn}
          isHidden={detail.isHidden}
          excerpt={detail.excerpt}
          coverUrl={detail.coverUrl}
          onClose={() => setDetail(null)}
          onSaved={() => setDetail(null)}
          onDeleted={() => setDetail(null)}
        />
      ) : null}
    </>
  );
}
