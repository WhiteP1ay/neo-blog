/**
 * 将数据库中的「类型 / 专题 key」编码为 URL 路径段，保证空字符串与特殊字符可逆。
 * - 空字符串使用字面量 __empty，避免无意义的空路径段。
 * - 其余使用 encodeURIComponent，便于包含 `/` 等特殊字符（单路径段内安全）。
 */
export const EMPTY_TOPIC_PATH_TOKEN = '__empty';

/**
 * @param raw 原始路径段（可为空串），用于照片等仍走路径筛选的场景
 */
export function encodeTopicPathSegment(raw: string): string {
  if (raw === '') {
    return EMPTY_TOPIC_PATH_TOKEN;
  }
  return encodeURIComponent(raw);
}

/**
 * @param segment 路由动态段（Next 已解码一层；__empty 与 decodeURIComponent 配合）
 */
export function decodeTopicPathSegment(segment: string): string {
  if (segment === EMPTY_TOPIC_PATH_TOKEN) {
    return '';
  }
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
