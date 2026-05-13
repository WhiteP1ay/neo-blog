import type { Metadata } from 'next';
import {
  generateBlogPostMetadata,
  generateBlogPostStaticParams,
  loadBlogPostForArticle,
} from '@/lib/app-pages/site-blog-pages';
import { BlogPostArticle } from '@/components/blog/BlogPostArticle';

export const generateStaticParams = generateBlogPostStaticParams;

export const revalidate = 60;

export function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return generateBlogPostMetadata(params, 'en');
}

export default async function EnPostPage({ params }: { params: Promise<{ id: string }> }) {
  const post = await loadBlogPostForArticle(params);
  return <BlogPostArticle post={post} locale="en" />;
}
