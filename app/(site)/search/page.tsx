import type { Metadata } from 'next';
import { SearchPageContent } from './SearchPageContent';

export const metadata: Metadata = {
  title: '搜索',
  description: '搜索 White Meta 博客文章',
  robots: { index: false, follow: true },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  return <SearchPageContent locale="zh" query={query} />;
}
