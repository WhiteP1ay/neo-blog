import { and, asc, eq, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import { loadTypesByPostIds, type PostTypeRow } from '@/server/utils/post-type-assignments';
import { requireAdmin } from '@/server/utils/require-admin';

function summarizeTypes(rows: PostTypeRow[]) {
  return rows.map((t) => ({
    id: t.id,
    code: t.code,
    nameZh: t.nameZh,
    nameEn: t.nameEn,
  }));
}

/**
 * 当前已上首页精选的文章（升序）。
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const rows = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      isHidden: postsTable.isHidden,
      homeFeatured: postsTable.homeFeatured,
      homeSortOrder: postsTable.homeSortOrder,
      excerpt: postsTable.excerpt,
      coverUrl: postsTable.coverUrl,
    })
    .from(postsTable)
    .where(and(eq(postsTable.homeFeatured, true), ne(postsTable.isHidden, true)))
    .orderBy(asc(postsTable.homeSortOrder), asc(postsTable.id));

  const typeMap = await loadTypesByPostIds(
    db,
    rows.map((r) => r.id),
  );

  return NextResponse.json({
    data: rows.map((r) => ({
      ...r,
      types: summarizeTypes(typeMap.get(r.id) ?? []),
    })),
  });
}
