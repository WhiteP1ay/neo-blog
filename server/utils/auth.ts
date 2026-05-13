import { cookies } from 'next/headers';
import { cache } from 'react';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/server/db/db';

import bcrypt from 'bcryptjs';

/**
 * Session key（Cookie 内为服务端签名的 JWT）
 */
const SESSION_KEY = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7天

const JWT_ALG = 'HS256';

function getSecretKeyBytes(): Uint8Array {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s) {
    throw new Error('缺少环境变量 AUTH_JWT_SECRET');
  }
  const key = new TextEncoder().encode(s);
  if (key.length < 32) {
    throw new Error('AUTH_JWT_SECRET 经 UTF-8 编码后长度须至少 32 字节');
  }
  return key;
}

function tryGetSecretKeyBytes(): Uint8Array | null {
  try {
    return getSecretKeyBytes();
  } catch {
    return null;
  }
}

/** 登录失败时向用户展示的 JWT 密钥配置说明（密码已通过校验但无法签发 Cookie 时使用） */
export const JWT_SECRET_SETUP_USER_MESSAGE = '无法完成登录 setup error';

export function isJwtSecretConfigurationError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('AUTH_JWT_SECRET');
}

async function signSessionJwt(userId: number): Promise<string> {
  const key = getSecretKeyBytes();
  const nowSec = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(String(userId))
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + SESSION_MAX_AGE)
    .sign(key);
}

async function verifySessionJwt(token: string): Promise<number | null> {
  const key = tryGetSecretKeyBytes();
  if (!key) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: [JWT_ALG] });
    const sub = payload.sub;
    if (sub == null || sub === '') {
      return null;
    }
    const userId = Number.parseInt(sub, 10);
    if (!Number.isInteger(userId) || userId < 1) {
      return null;
    }
    return userId;
  } catch {
    return null;
  }
}

/**
 * 当前登录用户及权限（来自 users 表）
 */
export type AuthSession = {
  userId: number;
  isAdmin: boolean;
  isVip: boolean;
};

/**
 * 创建 session：写入 HttpOnly Cookie（JWT）
 */
export async function createSession(userId: number) {
  const token = await signSessionJwt(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_KEY, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * 获取当前登录用户及权限；cookie 无效或用户不存在时返回 null。
 *
 * 使用 React `cache` 包装：同一个请求生命周期内多次调用（例如 `requireAdmin`
 * + 业务逻辑里又用到 session）只会查一次 users 表，避免远程数据库 RTT 叠加。
 */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_KEY);
  if (!session?.value) {
    return null;
  }

  const userId = await verifySessionJwt(session.value);
  if (userId == null) {
    return null;
  }

  const user = await db.query.usersTable.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  });

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    isAdmin: user.isAdmin,
    isVip: user.isVip,
  };
});

/** 管理类操作：已登录且 isAdmin */
export type RequireAdminResult = { ok: true; session: AuthSession } | { ok: false; error: string };

export function requireAdminSession(session: AuthSession | null): RequireAdminResult {
  if (!session) {
    return { ok: false, error: '未登录' };
  }
  if (!session.isAdmin) {
    return { ok: false, error: '无权限' };
  }
  return { ok: true, session };
}

/**
 * 清除 session
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
