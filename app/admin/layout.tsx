import { redirect } from "next/navigation";
import { getSession } from "@/server/utils/auth";
import { logout } from "@/app/login/actions";

/**
 * Admin布局 - 检查登录状态
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSession();

  if (!userId) {
    redirect("/login");
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">管理后台</h2>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-600 cursor-pointer hover:text-gray-900"
            >
              退出登录
            </button>
          </form>
        </div>
      </nav>
      {children}
    </>
  );
}

