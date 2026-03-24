import { redirect } from 'next/navigation';
import { getSession } from '@/server/utils/auth';
import { logout } from '@/app/login/actions';
import { Button } from '@/app/components/ui/button';

/**
 * Admin布局 - 检查登录状态
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSession();

  if (!userId) {
    redirect('/login');
  }

  return (
    <>
      <nav className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">管理后台</h2>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              退出登录
            </Button>
          </form>
        </div>
      </nav>
      {children}
    </>
  );
}
