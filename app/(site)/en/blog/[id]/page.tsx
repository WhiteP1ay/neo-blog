import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPostById, getPosts } from '@/server/actions/posts';
import { buildBlogPostMetadata } from '@/lib/blog-post-metadata';
import { BlogPostArticle } from '@/components/blog/BlogPostArticle';

export async function generateStaticParams() {
  const result = await getPosts();
  const posts = result.success && result.data ? result.data : [];

  return posts.map((post) => ({
    id: post.id.toString(),
  }));
}

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (Number.isNaN(postId)) {
    return {};
  }

  const result = await getPostById(postId, false);
  if (!result.success || !result.data) {
    return {};
  }

  return buildBlogPostMetadata(result.data, { locale: 'en', postId });
}

export default async function EnPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (Number.isNaN(postId)) {
    notFound();
  }

  const result = await getPostById(postId, false);
  if (!result.success || !result.data) {
    notFound();
  }

  return <BlogPostArticle post={result.data} locale="en" />;
}
