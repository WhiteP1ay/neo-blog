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
  return generateBlogPostMetadata(params, 'zh');
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const post = await loadBlogPostForArticle(params);
  return <BlogPostArticle post={post} locale="zh" />;
}
