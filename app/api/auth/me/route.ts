import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { getSession } from '@/server/utils/auth';

/**
 * 当前登录用户信息接口：
 * - 已登录：返回用户名与权限信息
 * - 未登录：返回 401
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const user = await db.query.usersTable.findFirst({
      where: (users, { eq }) => eq(users.id, session.userId),
    });
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    return NextResponse.json({
      username: user.name,
      isAdmin: user.isAdmin,
      isVip: user.isVip,
    });
  } catch (error) {
    console.error('API 获取当前用户失败:', error);
    return NextResponse.json({ error: '获取当前用户失败' }, { status: 500 });
  }
}
