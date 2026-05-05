'use client';

type UserCreateProps = {
  open: boolean;
  onClose: () => void;
  form: {
    newUserName: string;
    setNewUserName: (value: string) => void;
    newUserPassword: string;
    setNewUserPassword: (value: string) => void;
    newUserIsAdmin: boolean;
    setNewUserIsAdmin: (value: boolean) => void;
    createUser: () => Promise<void>;
  };
};

export function UserCreate({ open, onClose, form }: UserCreateProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <button className="absolute inset-0 bg-black/70" type="button" aria-label="关闭新增用户弹窗" onClick={onClose} />
      <div className="relative w-full max-w-xl space-y-3 rounded border bg-background p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">新增用户</h3>
          <button className="rounded border px-2 py-1 text-xs" type="button" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="space-y-2">
          <input className="w-full rounded border px-2 py-1" placeholder="用户名" value={form.newUserName} onChange={(e) => form.setNewUserName(e.target.value)} />
          <input
            className="w-full rounded border px-2 py-1"
            placeholder="密码（至少8位）"
            value={form.newUserPassword}
            type="password"
            onChange={(e) => form.setNewUserPassword(e.target.value)}
          />
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={form.newUserIsAdmin} onChange={(e) => form.setNewUserIsAdmin(e.target.checked)} />
            管理员
          </label>
          <button
            className="rounded border px-3 py-1"
            type="button"
            onClick={async () => {
              await form.createUser();
              onClose();
            }}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}
