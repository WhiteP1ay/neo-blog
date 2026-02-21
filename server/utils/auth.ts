import { cookies } from 'next/headers';
import { db } from '@/server/db/db';

import bcrypt from 'bcryptjs';

/**
 * Session key
 */
const SESSION_KEY = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7天

/**
 * 创建session
 */
export async function createSession(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_KEY, userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * 获取当前登录用户ID
 */
export async function getSession(): Promise<number | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_KEY);
  if (!session) {
    return null;
  }

  const userId = parseInt(session.value, 10);
  if (Number.isNaN(userId)) {
    return null;
  }

  // 验证用户是否存在
  const user = await db.query.usersTable.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  });

  return user ? userId : null;
}

/**
 * 清除session
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_KEY);
}

/**
 * 验证用户名和密码
 */
export async function verifyPassword(username: string, password: string): Promise<number | null> {
  try {
    const user = await db.query.usersTable.findFirst({
      where: (users, { eq }) => eq(users.name, username),
    });

    if (!user) {
      return null;
    }

    // 如果密码是明文（用于兼容旧数据），直接比较
    // 如果是hash，使用bcrypt验证
    let isValid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // bcrypt hash
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // 明文密码（兼容旧数据）
      isValid = user.password === password;
    }

    return isValid ? user.id : null;
  } catch (error) {
    console.error('验证密码失败:', error);
    return null;
  }
}

/**
 * 加密密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
