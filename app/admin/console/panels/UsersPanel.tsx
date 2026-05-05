'use client';

import type { UserItem } from '../types';

type UserFormState = {
  newUserName: string;
  setNewUserName: (value: string) => void;
  newUserPassword: string;
  setNewUserPassword: (value: string) => void;
  newUserIsAdmin: boolean;
  setNewUserIsAdmin: (value: boolean) => void;
  createUser: () => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
};

/**
 * 用户管理面板：表单与用户列表。
 */
export function UsersPanel({ users, form }: { users: UserItem[]; form: UserFormState }) {
  return (
    <section className="space-y-3 rounded border p-4">
      <h2 className="text-lg font-semibold">新增用户</h2>
      <div className="flex gap-2">
        <input
          className="rounded border px-2 py-1"
          placeholder="用户名"
          value={form.newUserName}
          onChange={(e) => form.setNewUserName(e.target.value)}
        />
        <input
          className="rounded border px-2 py-1"
          placeholder="密码（至少8位）"
          value={form.newUserPassword}
          type="password"
          onChange={(e) => form.setNewUserPassword(e.target.value)}
        />
        <label className="inline-flex items-center gap-1">
          <input type="checkbox" checked={form.newUserIsAdmin} onChange={(e) => form.setNewUserIsAdmin(e.target.checked)} />
          管理员
        </label>
        <button className="rounded border px-3 py-1" type="button" onClick={() => void form.createUser()}>
          创建
        </button>
      </div>
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id} className="flex items-center justify-between rounded border p-2">
            <span>
              #{user.id} {user.name} {user.isAdmin ? '(admin)' : ''}
            </span>
            <button className="rounded border px-2 py-1" type="button" onClick={() => void form.deleteUser(user.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
