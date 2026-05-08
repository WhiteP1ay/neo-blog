'use client';

import { AdminPostEditEntry } from '@/components/admin/AdminPostEditEntry';
import { useIsAdmin } from '@/hooks/admin/useIsAdmin';

/**
 * 文章详情页头部的管理员编辑入口：
 * - server component 的详情页本身保持静态/缓存
 * - 由这个 client 子组件向 /api/auth/me 探针，按需渲染编辑按钮
 */
export function BlogDetailAdminEdit({ postId }: { postId: number }) {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return <AdminPostEditEntry postId={postId} className="ml-2 align-middle" />;
}
