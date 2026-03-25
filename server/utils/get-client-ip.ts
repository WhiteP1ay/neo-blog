/**
 * 从 Edge / Node Route Handler 的 Headers 解析客户端 IP（代理场景下读常见转发头）。
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const realIP = headers.get('x-real-ip');

  if (forwarded) {
    // x-forwarded-for 可能为「客户端, 代理1, 代理2」，取第一个
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  if (realIP) {
    return realIP.trim();
  }

  return 'unknown';
}
