/**
 * 解析请求体中的 `typeIds`：缺省表示不修改；数组（可空）表示整表替换关联。
 */
export function parseTypeIdsField(raw: unknown): 'omit' | { ok: true; ids: number[] } | { ok: false } {
  if (raw === undefined) {
    return 'omit';
  }
  if (!Array.isArray(raw)) {
    return { ok: false };
  }
  const ids: number[] = [];
  for (const item of raw) {
    const n = typeof item === 'number' ? item : Number(item);
    if (!Number.isInteger(n) || n <= 0) {
      return { ok: false };
    }
    ids.push(n);
  }
  return { ok: true, ids: [...new Set(ids)] };
}
