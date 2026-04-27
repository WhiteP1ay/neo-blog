'use client';

/**
 * 右侧阅读/编辑面板：登录管理员且处于 editingPost 时显示编辑器，否则显示只读阅读视图。
 */

import { BlogPostReadView } from '@/components/blog/BlogPostReadView';
import { PostRichEditor } from './PostRichEditor';
import type { HomeExplorerPostDetailPayload } from '../type/payload';
import { useAdminUiStore } from '../store/admin-ui';

export type ReadingPaneProps = {
  postDetail: HomeExplorerPostDetailPayload | null;
  isAdminLoggedIn: boolean;
  onSavedEdit: () => void;
  onCancelEdit: () => void;
};

export function ReadingPane({ postDetail, isAdminLoggedIn, onSavedEdit, onCancelEdit }: ReadingPaneProps) {
  const editingPost = useAdminUiStore((s) => s.editingPost);

  return (
    <section className="min-w-0 flex-1 overflow-y-auto bg-background" aria-label="文章正文">
      {!postDetail ? (
        <div className="text-muted-foreground flex h-full min-h-48 items-center justify-center p-8 text-center text-sm">
          选择左侧列表中的一篇文章以阅读全文
        </div>
      ) : isAdminLoggedIn && editingPost ? (
        <PostRichEditor
          key={postDetail.id}
          post={{
            id: postDetail.id,
            title: postDetail.title,
            content: postDetail.contentSource,
            createdAt: postDetail.createdAt,
            updatedAt: postDetail.updatedAt,
          }}
          onSaved={onSavedEdit}
          onCancel={onCancelEdit}
        />
      ) : (
        <BlogPostReadView post={postDetail} />
      )}
    </section>
  );
}

