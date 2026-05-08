'use client';

import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { ZenPostEditor } from '@/components/admin/ZenPostEditor';

type EditDetail = {
  postId: number;
  initialTitle: string;
  initialType: string;
  initialContent: string;
  isHidden: boolean;
  excerpt: string;
  coverUrl: string;
};

type AdminPostEditEntryProps = {
  postId: number;
  /**
   * 由调用方控制按钮位置/显隐过渡（例如 group hover 渐显），
   * 避免在组件内部硬编码与上下文不匹配的样式。
   */
  className?: string;
};

/**
 * c 端文章列表 / 详情页给管理员准备的「编辑入口」：
 * - 渲染一个铅笔图标按钮（仅由调用方决定何时可见）
 * - 点击后向 admin 详情接口拉取完整数据，再以禅模式全屏打开
 * - 禅模式编辑器自身已在保存/关闭时给 toast 提示，故这里不再额外 toast
 *   （保存策略：toast only，不主动刷新当前页）
 */
export function AdminPostEditEntry({ postId, className }: AdminPostEditEntryProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<EditDetail | null>(null);

  const openEditor = async () => {
    if (loading || detail) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, { credentials: 'same-origin' });
      const payload = (await response.json()) as {
        data?: {
          title?: string;
          type?: string;
          content?: string;
          isHidden?: boolean;
          excerpt?: string | null;
          coverUrl?: string | null;
        };
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? '加载文章详情失败');
      }
      setDetail({
        postId,
        initialTitle: payload.data.title ?? '',
        initialType: payload.data.type ?? '',
        initialContent: payload.data.content ?? '',
        isHidden: payload.data.isHidden === true,
        excerpt: payload.data.excerpt ?? '',
        coverUrl: payload.data.coverUrl ?? '',
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
        // 阻止冒泡到外层 Link / row，避免点编辑时误触发跳转。
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void openEditor();
        }}
        disabled={loading}
        className={`inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60 ${className ?? ''}`.trim()}
        aria-label="禅模式编辑该文章"
        title="禅模式编辑"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {detail ? (
        <ZenPostEditor
          mode="edit"
          open
          postId={detail.postId}
          initialTitle={detail.initialTitle}
          initialType={detail.initialType}
          initialContent={detail.initialContent}
          isHidden={detail.isHidden}
          excerpt={detail.excerpt}
          coverUrl={detail.coverUrl}
          onClose={() => setDetail(null)}
          onSaved={() => setDetail(null)}
        />
      ) : null}
    </>
  );
}
