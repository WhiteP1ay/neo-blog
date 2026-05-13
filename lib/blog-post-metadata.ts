import type { Metadata } from 'next';
import type { Post } from '@/server/types/models';
import type { SiteLocale } from '@/lib/site-locale';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export function buildBlogPostMetadata(
  post: Post,
  options: { locale: SiteLocale; postId: number },
): Metadata {
  const { locale, postId } = options;
  const hasEnBody = Boolean(post.contentEn?.trim());
  const headline =
    locale === 'en' && post.titleEn?.trim()
      ? post.titleEn.trim()
      : locale === 'en' && hasEnBody
        ? post.title
        : post.title;

  const bodyHtml =
    locale === 'en' && hasEnBody ? (post.contentEn as string) : post.content;
  const textContent = stripHtml(bodyHtml);
  const description =
    textContent.length > 150 ? `${textContent.substring(0, 150)}...` : textContent || (locale === 'en' ? 'Read more' : '阅读更多内容');

  const publishedTime = post.createdAt ? new Date(post.createdAt).toISOString() : undefined;
  const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined;

  const zhPath = `/blog/${postId}`;
  const enPath = `/en/blog/${postId}`;

  return {
    title: headline,
    description,
    keywords:
      locale === 'en'
        ? [headline, 'blog', 'technical writing']
        : [headline, '博客', '技术文章'],
    authors: [{ name: 'whitePlay' }],
    openGraph: {
      title: headline,
      description,
      type: 'article',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      authors: ['whitePlay'],
      siteName: 'White Meta',
    },
    twitter: {
      card: 'summary_large_image',
      title: headline,
      description,
    },
    alternates: {
      canonical: locale === 'en' ? enPath : zhPath,
      languages: {
        zh: zhPath,
        en: enPath,
      },
    },
  };
}
