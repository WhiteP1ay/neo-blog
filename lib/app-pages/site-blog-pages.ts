import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { blogListPageTitle } from '@/components/site/BlogListPage';
import { buildBlogPostMetadata } from '@/lib/blog-post-metadata';
import type { SiteLocale } from '@/lib/site-locale';
import { getPostById, getPosts } from '@/server/actions/posts';
import type { Post } from '@/server/types/models';

const blogListSeo: Record<SiteLocale, Pick<Metadata, 'description' | 'keywords' | 'openGraph'>> = {
  zh: {
    description: 'White Meta 博客 - 技术文章和编程分享',
    keywords: ['博客', '技术文章', '编程', '开发'],
    openGraph: {
      title: 'White Meta 博客',
      description: '技术文章和编程分享',
      type: 'website',
    },
  },
  en: {
    description: 'White Meta — technical writing and programming notes',
    keywords: ['blog', 'engineering'],
    openGraph: {
      title: 'White Meta Blog',
      description: 'Technical writing and programming notes',
      type: 'website',
    },
  },
};

export async function generateBlogListMetadata(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
  locale: SiteLocale,
): Promise<Metadata> {
  const sp = await searchParams;
  const title = await blogListPageTitle(locale, sp);
  return {
    title,
    ...blogListSeo[locale],
  };
}

export async function generateBlogPostStaticParams() {
  const result = await getPosts();
  const posts = result.success && result.data ? result.data : [];
  return posts.map((post) => ({
    id: post.id.toString(),
  }));
}

export async function generateBlogPostMetadata(params: Promise<{ id: string }>, locale: SiteLocale): Promise<Metadata> {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (Number.isNaN(postId)) {
    return {};
  }
  const result = await getPostById(postId, false);
  if (!result.success || !result.data) {
    return {};
  }
  return buildBlogPostMetadata(result.data, { locale, postId });
}

export async function loadBlogPostForArticle(params: Promise<{ id: string }>): Promise<Post> {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (Number.isNaN(postId)) {
    notFound();
  }
  const result = await getPostById(postId, false);
  if (!result.success || !result.data) {
    notFound();
  }
  return result.data;
}
