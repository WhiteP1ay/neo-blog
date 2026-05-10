'use client';

import type { UserItem } from '../../types';

type UserTableProps = {
  users: UserItem[];
  deleteUser: (id: number) => Promise<void>;
};

/** 表格与移动端卡片共用的删除按钮样式 */
const deleteBtnClass =
  'min-h-10 touch-manipulation rounded border px-3 py-2 text-sm sm:min-h-0 sm:px-2 sm:py-1';

export function UserTable({ users, deleteUser }: UserTableProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  ID {user.id} · {user.isAdmin ? '管理员' : '普通用户'}
                </p>
              </div>
              <button className={deleteBtnClass} type="button" onClick={() => void deleteUser(user.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">用户名</th>
              <th className="px-3 py-2">管理员</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-3 py-2">{user.id}</td>
                <td className="px-3 py-2">{user.name}</td>
                <td className="px-3 py-2">{user.isAdmin ? '是' : '否'}</td>
                <td className="px-3 py-2">
                  <button className="rounded border px-2 py-1" type="button" onClick={() => void deleteUser(user.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
