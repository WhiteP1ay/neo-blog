'use client';

import type { UserItem } from '../../types';

type UserTableProps = {
  users: UserItem[];
  deleteUser: (id: number) => Promise<void>;
};

export function UserTable({ users, deleteUser }: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded border">
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
  );
}
