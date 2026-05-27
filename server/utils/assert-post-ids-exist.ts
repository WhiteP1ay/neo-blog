import { inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@/server/db/schema';
import { postsTable } from '@/server/db/schema';

type Db = NodePgDatabase<typeof schema>;

export async function assertPostIdsExist(db: Db, postIds: number[]): Promise<boolean> {
  if (postIds.length === 0) return true;
  const rows = await db.select({ id: postsTable.id }).from(postsTable).where(inArray(postsTable.id, postIds));
  return rows.length === postIds.length;
}
