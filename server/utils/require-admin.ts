import { getSession } from '@/server/utils/auth';

/**
 * 校验当前请求是否为管理员会话。
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    return { ok: false as const };
  }
  return { ok: true as const, session };
}
