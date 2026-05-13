import { redirect } from 'next/navigation';
import type { SiteLocale } from '@/lib/site-locale';
import { pathWithLocale } from '@/lib/site-locale';
import { resolveBlogListSearch } from '@/lib/blog-list-query';
import { getHomeExplorerData } from '@/server/actions/posts';
import { SiteWelcome } from '@/components/site/SiteWelcome';
import { PostList } from '@/app/(site)/blog/PostList';

type SearchParamsInput = Record<string, string | string[] | undefined>;

/**
 * 博客列表（按类型 query 筛选）；与 `(site)` 布局配合。
 */
export async function BlogListPage({ locale, searchParams }: { locale: SiteLocale; searchParams: SearchParamsInput }) {
  const explorerLocale = locale === 'en' ? 'en' : 'zh';
  const result = await getHomeExplorerData(explorerLocale);
  if (!result.success || !result.data?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {locale === 'en' ? 'No topics available yet.' : '暂无可浏览的分类。'}
      </p>
    );
  }
  const categories = result.data;
  const resolved = resolveBlogListSearch(categories, searchParams);
  if (resolved.kind === 'redirect') {
    redirect(pathWithLocale(resolved.path, locale));
  }
  return (
    <>
      <div className="mb-6 sm:mb-8">
        <SiteWelcome />
      </div>
      <PostList categories={categories} selectedTypeCode={resolved.selectedTypeCode} />
    </>
  );
}

export async function blogListPageTitle(locale: SiteLocale, searchParams: SearchParamsInput): Promise<string> {
  const explorerLocale = locale === 'en' ? 'en' : 'zh';
  const result = await getHomeExplorerData(explorerLocale);
  if (!result.success || !result.data?.length) {
    return locale === 'en' ? 'Blog' : '博客';
  }
  const categories = result.data;
  const resolved = resolveBlogListSearch(categories, searchParams);
  if (resolved.kind === 'redirect') {
    const first = categories[0];
    const label = first.typeCode === '' ? (locale === 'en' ? 'Unnamed' : '未命名') : first.name;
    return `${label} | White Meta`;
  }
  const active = categories.find((c) => c.typeCode === resolved.selectedTypeCode);
  const label = active?.name ?? (locale === 'en' ? 'Blog' : '博客');
  return `${label} | White Meta`;
}
