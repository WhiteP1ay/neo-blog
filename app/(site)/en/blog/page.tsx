import type { Metadata } from 'next';
import { BlogListPage } from '@/components/site/BlogListPage';
import { generateBlogListMetadata } from '@/lib/app-pages/site-blog-pages';

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  return generateBlogListMetadata(searchParams, 'en');
}

export default async function EnBlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <BlogListPage locale="en" searchParams={sp} />;
}
