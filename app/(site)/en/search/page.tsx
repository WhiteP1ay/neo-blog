import type { Metadata } from 'next';
import { SearchPageContent } from '@/app/(site)/search/SearchPageContent';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search White Meta blog posts',
  robots: { index: false, follow: true },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function EnSearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  return <SearchPageContent locale="en" query={query} />;
}
