import { sql, type SQL } from "drizzle-orm";

/**
 * 构建 posts.searchVector 的 SQL 表达式（zhparser chinese 配置）
 */
export function buildSearchVectorSql(title: string, plainBody: string): SQL {
  return sql`(
    setweight(to_tsvector('chinese', ${title}), 'A') ||
    setweight(to_tsvector('chinese', ${plainBody}), 'B')
  )`;
}
