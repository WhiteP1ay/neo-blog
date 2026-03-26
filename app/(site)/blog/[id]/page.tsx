import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPostById, getPosts } from '@/server/actions/posts';
import { highlightCodeBlocksInHtml } from '@/server/utils/highlight-code-blocks-in-html';
import { BlogPostReadView } from '@/components/site/blog/BlogPostReadView';
import { Breadcrumb } from '@/components/site/Breadcrumb';
import { StructuredData, createBlogPostingSchema } from '@/components/site/StructuredData';

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

  const post = result.data;

  const textContent = post.content.replace(/<[^>]*>/g, '').trim();
  const description = textContent.length > 150 ? `${textContent.substring(0, 150)}...` : textContent || '阅读更多内容';

  const publishedTime = post.createdAt ? new Date(post.createdAt).toISOString() : undefined;
  const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined;

  return {
    title: post.title,
    description,
    keywords: [post.title, '博客', '技术文章'],
    authors: [{ name: 'whitePlay' }],
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      authors: ['whitePlay'],
      siteName: 'White Meta',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    },
    alternates: {
      canonical: `/blog/${postId}`,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (Number.isNaN(postId)) {
    notFound();
  }

  const result = await getPostById(postId, false);
  if (!result.success || !result.data) {
    notFound();
  }

  const row = result.data;
  const contentSource = row.content;
  const contentHtml = await highlightCodeBlocksInHtml(contentSource);

  const publishedTime = row.createdAt ? new Date(row.createdAt).toISOString() : undefined;
  const modifiedTime = row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined;

  const jsonLd = createBlogPostingSchema({
    headline: row.title,
    description: contentSource.replace(/<[^>]*>/g, '').substring(0, 200),
    datePublished: publishedTime,
    dateModified: modifiedTime,
  });

  const post = {
    id: row.id,
    title: row.title,
    content: contentHtml,
    contentSource,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };

  return (
    <>
      <StructuredData data={jsonLd} />
      <main className="site-page">
        <div className="site-container">
          <div className="mb-4">
            <Breadcrumb currentLabel={row.title} />
          </div>
          <BlogPostReadView post={post} />
        </div>
      </main>
    </>
  );
}
