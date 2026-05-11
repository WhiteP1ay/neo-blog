import { NextResponse } from 'next/server';
import { clearSession } from '@/server/utils/auth';

/**
 * 登出接口：
 * - 清理 `admin_session` Cookie
 */
export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API 登出失败:', error);
    return NextResponse.json({ error: '登出失败' }, { status: 500 });
  }
}
