'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/server/actions/login';
import { BackToHome } from '@/components/site/BackToHome';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);

    if (result.success) {
      router.push('/');
      router.refresh();
    } else {
      setError(result.error || '登录失败');
      setLoading(false);
    }
  };

  return (
    <section aria-label="管理员登录">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">管理员登录</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error ? (
          <p role="alert" className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className="space-y-1">
          <label htmlFor="username" className="text-sm font-medium">
            用户名
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-9 rounded border border-border bg-background px-3 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <div className="mt-6">
        <BackToHome showIcon={false} className="text-sm" />
      </div>
    </section>
  );
}
