export const MAX_BULK_POST_IDS = 200;

export function parseBulkPostIds(raw: unknown): { ok: true; ids: number[] } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: 'postIds 不能为空' };
  }
  const ids: number[] = [];
  for (const item of raw) {
    const n = typeof item === 'number' ? item : Number.parseInt(String(item), 10);
    if (!Number.isInteger(n) || n <= 0) {
      return { ok: false, error: 'postIds 须为正整数数组' };
    }
    ids.push(n);
  }
  const unique = [...new Set(ids)];
  if (unique.length > MAX_BULK_POST_IDS) {
    return { ok: false, error: `单次最多 ${MAX_BULK_POST_IDS} 篇` };
  }
  return { ok: true, ids: unique };
}
