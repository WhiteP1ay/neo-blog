'use client';

import { useState } from 'react';
import type { UserItem } from './types';
import { UserCreate } from './users/UserCreate';
import { UserTable } from './users/UserTable';

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

export function UsersSection({ users, form }: { users: UserItem[]; form: UserFormState }) {
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <section className="space-y-3 rounded border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">用户管理</h2>
        <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setOpenCreate(true)}>
          新增用户
        </button>
      </div>
      <UserTable users={users} deleteUser={form.deleteUser} />
      <UserCreate open={openCreate} onClose={() => setOpenCreate(false)} form={form} />
    </section>
  );
}
