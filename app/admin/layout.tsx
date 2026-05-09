import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminDocumentScrollbar } from '@/components/admin/AdminDocumentScrollbar';
import { AdminQueryProvider } from './console/AdminQueryProvider';
import { AdminSettingsPopover } from '@/components/admin/AdminSettingsPopover';
import { getSession } from '@/server/utils/auth';

const ADMIN_SECTIONS = [
  { href: '/admin/posts', label: '博文管理' },
  { href: '/admin/photos', label: '照片管理' },
  { href: '/admin/users', label: '用户管理' },
  { href: '/admin/comments', label: '评论管理' },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session?.isAdmin) {
    redirect('/login');
  }

  return (
    <AdminDocumentScrollbar>
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="rounded border px-3 py-1 text-sm hover:bg-muted">
              返回首页
            </Link>
            {ADMIN_SECTIONS.map((section) => (
              <Link key={section.href} href={section.href} className="rounded border px-3 py-1 text-sm hover:bg-muted">
                {section.label}
              </Link>
            ))}
          </div>
          <AdminSettingsPopover />
        </div>
        <AdminQueryProvider>{children}</AdminQueryProvider>
      </div>
    </AdminDocumentScrollbar>
  );
}
