import { inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@/server/db/schema';
import { postTypesTable } from '@/server/db/schema';

type Db = NodePgDatabase<typeof schema>;

export async function assertTypeIdsValid(db: Db, ids: number[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const rows = await db.select({ id: postTypesTable.id }).from(postTypesTable).where(inArray(postTypesTable.id, ids));
  return rows.length === ids.length;
}
