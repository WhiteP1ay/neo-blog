import { eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@/server/db/schema';
import { postTypeAssignmentsTable, postTypesTable } from '@/server/db/schema';

type Db = NodePgDatabase<typeof schema>;

export type PostTypeRow = {
  id: number;
  code: string;
  nameZh: string;
  nameEn: string;
  sortOrder: number;
  suppressLinkedPostsGlobally: boolean;
};

/**
 * 用新的 typeId 列表完全替换某篇文章的类型关联（幂等）。
 */
export async function replacePostTypeAssignments(db: Db, postId: number, typeIds: number[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(postTypeAssignmentsTable).where(eq(postTypeAssignmentsTable.postId, postId));
    if (typeIds.length === 0) return;
    await tx.insert(postTypeAssignmentsTable).values(typeIds.map((typeId) => ({ postId, typeId })));
  });
}

/**
 * 批量查询：postId -> 该文关联的类型（按 sortOrder、id 排序）。
 */
export async function loadTypesByPostIds(db: Db, postIds: number[]): Promise<Map<number, PostTypeRow[]>> {
  const map = new Map<number, PostTypeRow[]>();
  if (postIds.length === 0) return map;

  const rows = await db
    .select({
      postId: postTypeAssignmentsTable.postId,
      id: postTypesTable.id,
      code: postTypesTable.code,
      nameZh: postTypesTable.nameZh,
      nameEn: postTypesTable.nameEn,
      sortOrder: postTypesTable.sortOrder,
      suppressLinkedPostsGlobally: postTypesTable.suppressLinkedPostsGlobally,
    })
    .from(postTypeAssignmentsTable)
    .innerJoin(postTypesTable, eq(postTypeAssignmentsTable.typeId, postTypesTable.id))
    .where(inArray(postTypeAssignmentsTable.postId, postIds));

  for (const row of rows) {
    const list = map.get(row.postId) ?? [];
    list.push({
      id: row.id,
      code: row.code,
      nameZh: row.nameZh,
      nameEn: row.nameEn,
      sortOrder: row.sortOrder,
      suppressLinkedPostsGlobally: row.suppressLinkedPostsGlobally,
    });
    map.set(row.postId, list);
  }

  for (const [, list] of map) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }

  return map;
}
