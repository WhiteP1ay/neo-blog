import type { Metadata } from 'next';
import { BlogListPage, blogListPageTitle } from '@/components/site/BlogListPage';

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const title = await blogListPageTitle('zh', sp);
  return {
    title,
    description: 'White Meta 博客 - 技术文章和编程分享',
    keywords: ['博客', '技术文章', '编程', '开发'],
    openGraph: {
      title: 'White Meta 博客',
      description: '技术文章和编程分享',
      type: 'website',
    },
  };
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
