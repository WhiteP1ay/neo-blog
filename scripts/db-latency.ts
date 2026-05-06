import 'dotenv/config';
import { Pool } from 'pg';

/**
 * 测试数据库一些常见操作的延迟，用于排查 admin 接口缓慢问题。
 */
async function measure(label: string, fn: () => Promise<unknown>) {
  const start = performance.now();
  await fn();
  const cost = performance.now() - start;
  console.log(`${label.padEnd(40)} ${cost.toFixed(1)}ms`);
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

  await measure('1. 首次 connect()', async () => {
    const client = await pool.connect();
    client.release();
  });

  await measure('2. SELECT 1', async () => {
    await pool.query('SELECT 1');
  });

  await measure('3. SELECT count(*) FROM posts', async () => {
    await pool.query('SELECT count(*) FROM posts');
  });

  await measure('4. SELECT * FROM posts (no order)', async () => {
    await pool.query('SELECT * FROM posts');
  });

  await measure('5. SELECT * FROM posts ORDER BY ...', async () => {
    await pool.query(
      'SELECT * FROM posts ORDER BY "sortOrder" ASC, "createdAt" DESC, id ASC',
    );
  });

  await measure('6. SELECT id,title FROM posts ORDER BY ...', async () => {
    await pool.query(
      'SELECT id, title FROM posts ORDER BY "sortOrder" ASC, "createdAt" DESC, id ASC',
    );
  });

  await measure('7. SELECT * FROM users WHERE id=1', async () => {
    await pool.query('SELECT * FROM users WHERE id = $1', [1]);
  });

  await measure('8. UPDATE posts SET updated_at=now() WHERE id=51 (returning *)', async () => {
    await pool.query('UPDATE posts SET "updatedAt" = now() WHERE id = $1 RETURNING *', [51]);
  });

  await measure('9. UPDATE posts SET updated_at=now() WHERE id=51 (returning id)', async () => {
    await pool.query('UPDATE posts SET "updatedAt" = now() WHERE id = $1 RETURNING id', [51]);
  });

  await measure('10. 5 次串行 SELECT 1', async () => {
    for (let i = 0; i < 5; i++) {
      await pool.query('SELECT 1');
    }
  });

  await measure('11. 5 次并行 SELECT 1', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () => pool.query('SELECT 1')),
    );
  });

  // 统计 posts 字段长度，定位"传输哪些字段最重"
  const sizeRows = await pool.query<{
    rows_count: string;
    avg_content: string;
    max_content: string;
    sum_content: string;
    sum_md: string;
  }>(
    `SELECT count(*)::text AS rows_count,
            avg(length(content))::text AS avg_content,
            max(length(content))::text AS max_content,
            sum(length(content))::text AS sum_content,
            coalesce(sum(length("markdownContent")), 0)::text AS sum_md
       FROM posts`,
  );
  console.log('\n[posts 字段尺寸]');
  console.log('  行数:                ', sizeRows.rows[0].rows_count);
  console.log('  content 平均字符数:  ', sizeRows.rows[0].avg_content);
  console.log('  content 最大字符数:  ', sizeRows.rows[0].max_content);
  console.log('  content 总字符数:    ', sizeRows.rows[0].sum_content);
  console.log('  markdownContent 总:  ', sizeRows.rows[0].sum_md);

  await pool.end();
}

main().catch((error) => {
  console.error('诊断脚本失败:', error);
  process.exit(1);
});
