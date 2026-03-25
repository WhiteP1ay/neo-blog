'use server';

import { verifyPassword, createSession, clearSession, getSession } from '@/server/utils/auth';
import { redirect } from 'next/navigation';
import { actionErr, actionOkVoid } from '@/server/types/action-result';
import type { ActionVoidResult } from '@/server/types/action-result';

/**
 * Server Action: 用户登录
 */
export async function login(username: string, password: string): Promise<ActionVoidResult> {
  try {
    if (!username || !password) {
      return actionErr('请填写用户名和密码');
    }

    const userId = await verifyPassword(username, password);
    if (!userId) {
      return actionErr('用户名或密码错误');
    }

    await createSession(userId);

    return actionOkVoid();
  } catch (error) {
    console.error('登录失败:', error);
    return actionErr('登录失败');
  }
}

/**
 * Server Action: 用户登出
 */
export async function logout() {
  await clearSession();
  redirect('/login');
}

/**
 * Server Action: 检查是否已登录
 */
export async function checkAuth() {
  const session = await getSession();
  return {
    success: session !== null,
    userId: session?.userId,
    isAdmin: session?.isAdmin ?? false,
    isVip: session?.isVip ?? false,
  };
}

/**
 * Server Action: 检查是否为管理员
 */
export async function checkAdminAuth(): Promise<ActionVoidResult> {
  const session = await getSession();
  if (!session) {
    return actionErr('未登录');
  }
  if (!session.isAdmin) {
    return actionErr('无权限');
  }
  return actionOkVoid();
}
