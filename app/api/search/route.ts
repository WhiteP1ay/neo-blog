import { NextRequest, NextResponse } from 'next/server';
import { searchPosts } from '@/server/actions/posts';

/**
 * GET /api/search?q=关键词&limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ error: '缺少参数 q' }, { status: 400 });
  }

  const limitParam = request.nextUrl.searchParams.get('limit');
  const offsetParam = request.nextUrl.searchParams.get('offset');
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
  const offset = offsetParam ? Number.parseInt(offsetParam, 10) : undefined;

  const result = await searchPosts(q, { limit, offset });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ data: result.data });
}
