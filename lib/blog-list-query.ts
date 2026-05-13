import type { HomeExplorerCategory } from '@/server/types/explorer';

/** 列表筛选：按类型的唯一短码，对应 `GET /api/posts?type=` 与 `post_types.code`。 */
export const BLOG_LIST_TYPE_QUERY = 'type' as const;
/** 未分类桶（无关联类型）使用 `?uncategorized=1`，避免与真实 type 码冲突。 */
export const BLOG_LIST_UNCATEGORIZED_QUERY = 'uncategorized' as const;

export function firstSearchParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/**
 * 前台博文列表路径（无 `/en` 前缀；英文站请再包一层 {@link pathWithLocale}）。
 */
export function publicBlogListPath(typeCode: string): string {
  if (typeCode === '') {
    return `/blog?${BLOG_LIST_UNCATEGORIZED_QUERY}=1`;
  }
  return `/blog?${BLOG_LIST_TYPE_QUERY}=${encodeURIComponent(typeCode)}`;
}

/** 后台博文列表筛选 URL（与前台使用相同 query 名，便于对照）。 */
export function adminPostsListPath(typeCode: string | null): string {
  if (typeCode === null) return '/admin/posts';
  if (typeCode === '') {
    return `/admin/posts?${BLOG_LIST_UNCATEGORIZED_QUERY}=1`;
  }
  return `/admin/posts?${BLOG_LIST_TYPE_QUERY}=${encodeURIComponent(typeCode)}`;
}

export function defaultBlogListPath(categories: HomeExplorerCategory[]): string {
  const first = categories[0];
  return publicBlogListPath(first.typeCode);
}

export type BlogListSearchResolved = { kind: 'redirect'; path: string } | { kind: 'ok'; selectedTypeCode: string };

/**
 * 根据 URL 查询串解析当前应展示的分类；无效组合时返回应重定向到的列表路径。
 */
export function resolveBlogListSearch(
  categories: HomeExplorerCategory[],
  searchParams: Record<string, string | string[] | undefined>,
): BlogListSearchResolved {
  const typeRaw = firstSearchParam(searchParams[BLOG_LIST_TYPE_QUERY]);
  const uncRaw = firstSearchParam(searchParams[BLOG_LIST_UNCATEGORIZED_QUERY]);

  const hasUncategorizedBucket = categories.some((c) => c.typeCode === '');

  if (typeRaw !== undefined && typeRaw !== '') {
    const matched = categories.find((c) => c.typeCode === typeRaw);
    if (!matched) {
      return { kind: 'redirect', path: defaultBlogListPath(categories) };
    }
    return { kind: 'ok', selectedTypeCode: typeRaw };
  }

  if (uncRaw === '1') {
    if (!hasUncategorizedBucket) {
      return { kind: 'redirect', path: defaultBlogListPath(categories) };
    }
    return { kind: 'ok', selectedTypeCode: '' };
  }

  return { kind: 'redirect', path: defaultBlogListPath(categories) };
}
