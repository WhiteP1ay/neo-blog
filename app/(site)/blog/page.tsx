import type { Metadata } from 'next';
import { BlogListPage } from '@/components/site/BlogListPage';
import { generateBlogListMetadata } from '@/lib/app-pages/site-blog-pages';

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  return generateBlogListMetadata(searchParams, 'zh');
}

/**
 * 博文列表：`/blog?type=<code>` 或 `/blog?uncategorized=1`；无查询参数时重定向到默认分类。
 */
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <BlogListPage locale="zh" searchParams={sp} />;
}
