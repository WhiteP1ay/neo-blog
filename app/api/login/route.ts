import { NextResponse } from 'next/server';
import { createSession, verifyPassword } from '@/server/utils/auth';

type LoginRequestBody = {
  username?: unknown;
  password?: unknown;
};

/**
 * 登录接口：
 * - 校验用户名密码
 * - 写入 session cookie
 * - 返回 { success: true }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequestBody;
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!username || !password) {
      return NextResponse.json({ error: '请填写用户名和密码' }, { status: 400 });
    }

    const userId = await verifyPassword(username, password);
    if (!userId) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    await createSession(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API 登录失败:', error);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
