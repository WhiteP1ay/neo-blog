/**
 * 当 drizzle 迁移表与真实库不一致、无法 drizzle-kit migrate 时，
 * 单独补齐 topics.sortOrder，避免首页 getHomeExplorerData 报错。
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('缺少环境变量 DATABASE_URL');
    process.exit(1);
  }
  const sql = readFileSync(join(process.cwd(), 'scripts/ensure-topics-sort-order-column.sql'), 'utf8');
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(sql);
    console.log('topics.sortOrder 已就绪（若原本缺失则已添加并回填）');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
