/**
 * Home Explorer 通用工具函数（纯函数）。
 */

export function topicToQueryValue(topicKey: number): string {
  return String(topicKey);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

