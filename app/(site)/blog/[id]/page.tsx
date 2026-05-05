import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPostById, getPosts } from '@/server/actions/posts';
import { highlightCodeBlocksInHtml } from '@/server/utils/highlight-code-blocks-in-html';
import { StructuredData, createBlogPostingSchema } from '@/components/site/StructuredData';
import Link from 'next/link';
import { CommentsSection } from '@/components/blog/CommentsSection';

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

  return (
    <article className="retro-content">
      <StructuredData data={jsonLd} />
      <header>
        <p className="text-xs text-muted-foreground">
          <Link href="/blog">返回文章列表</Link>
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{row.title}</h1>
        {/* <p className="mt-2 text-xs text-muted-foreground">
          发布时间：{formatDate(row.createdAt)} · 更新时间：{formatDate(row.updatedAt)}
        </p> */}
      </header>

      <hr className="site-hr" />

      <section
        className="retro-paper prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none rounded-sm p-4 sm:p-6"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      <section className="mt-8 border-t border-border/70 pt-6">
        <CommentsSection postId={row.id} />
      </section>
    </article>
  );
}

/**
 * 日期格式化：确保 Date/null 都能稳定渲染。
 */
// function formatDate(date: Date | null): string {
//   if (!date) {
//     return '未知';
//   }
//   return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
// }
