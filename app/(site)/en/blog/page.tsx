import type { Metadata } from 'next';
import { BlogListPage, blogListPageTitle } from '@/components/site/BlogListPage';

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const title = await blogListPageTitle('en', sp);
  return {
    title,
    description: 'White Meta — technical writing and programming notes',
    keywords: ['blog', 'engineering'],
    openGraph: {
      title: 'White Meta Blog',
      description: 'Technical writing and programming notes',
      type: 'website',
    },
  };
}

export default async function EnBlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <BlogListPage locale="en" searchParams={sp} />;
}
