import type { SQL } from 'drizzle-orm';
import { buildPlainBody } from '@/server/utils/postPlainText';
import { buildSearchVectorSql } from '@/server/utils/searchIndex';

/**
 * 根据标题与 Markdown 生成全文检索字段（zhparser chinese）
 */
export function buildPostSearchIndexFields(
  title: string,
  markdownContent: string | null | undefined,
): { plainBody: string; searchVector: SQL } {
  const plainBody = buildPlainBody(markdownContent);
  return {
    plainBody,
    searchVector: buildSearchVectorSql(title, plainBody),
  };
}
