'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';

type AdminPostEditEntryProps = {
  postId: number;
  className?: string;
};

/**
 * 前台列表 / 详情给管理员准备的「编辑入口」：跳转后台编辑路由。
 */
export function AdminPostEditEntry({ postId, className }: AdminPostEditEntryProps) {
  return (
    <Link
      href={`/admin/posts/${postId}/edit`}
      onClick={(event) => {
        event.stopPropagation();
      }}
      className={`inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background ${className ?? ''}`.trim()}
      aria-label="编辑文章"
      title="编辑文章"
    >
      <Pencil className="h-3.5 w-3.5" />
    </Link>
  );
}
