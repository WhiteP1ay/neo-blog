/**
 * Home Explorer 通用工具函数（纯函数）。
 *
 * 注意：
 * - 这里不放常量（见 constant/）
 * - 这里不放类型（见 type/）
 */

/**
 * 将 topicKey 转成 URL query 中的字符串值。
 */
export function topicToQueryValue(topicKey: number): string {
  return String(topicKey);
}

/**
 * 将数字限制在 [min, max] 区间内。
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

