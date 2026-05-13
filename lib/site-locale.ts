export type SiteLocale = 'zh' | 'en';

export const EN_PREFIX = '/en';

/** 去掉 `/en` 前缀后的 pathname（始终以 `/` 开头）。 */
export function stripEnPrefix(pathname: string): string {
  if (pathname === EN_PREFIX) {
    return '/';
  }
  if (pathname.startsWith(`${EN_PREFIX}/`)) {
    return pathname.slice(EN_PREFIX.length);
  }
  return pathname;
}

export function localeFromPathname(pathname: string): SiteLocale {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`) ? 'en' : 'zh';
}

/**
 * 将「无语言前缀」的路径转为当前语言下的 pathname。
 * @param path 如 `/`、`/blog/1`、`/blog?type=foo`（不要带 /en）
 */
export function pathWithLocale(path: string, locale: SiteLocale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (locale === 'zh') {
    return stripEnPrefix(normalized);
  }
  if (normalized === '/') {
    return EN_PREFIX;
  }
  return `${EN_PREFIX}${normalized}`;
}
