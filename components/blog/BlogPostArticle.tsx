import Link from 'next/link';
import { highlightCodeBlocksInHtml } from '@/server/utils/highlight-code-blocks-in-html';
import type { Post } from '@/server/types/models';
import type { SiteLocale } from '@/lib/site-locale';
import { pathWithLocale } from '@/lib/site-locale';
import { StructuredData, createBlogPostingSchema } from '@/components/site/StructuredData';
import { BlogDetailAdminEdit } from '@/components/blog/BlogDetailAdminEdit';
import { CommentsSection } from '@/components/blog/CommentsSection';

type BlogPostArticleProps = {
  post: Post;
  locale: SiteLocale;
};

export async function BlogPostArticle({ post, locale }: BlogPostArticleProps) {
  const hasEnBody = Boolean(post.contentEn?.trim());
  const useEn = locale === 'en' && hasEnBody;
  const contentSource = useEn ? (post.contentEn as string) : post.content;
  const contentHtml = await highlightCodeBlocksInHtml(contentSource);

  const publishedTime = post.createdAt ? new Date(post.createdAt).toISOString() : undefined;
  const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined;

  const headline =
    locale === 'en' && post.titleEn?.trim()
      ? post.titleEn.trim()
      : locale === 'en' && hasEnBody
        ? post.title
        : post.title;

  const jsonLd = createBlogPostingSchema({
    headline,
    description: contentSource.replace(/<[^>]*>/g, '').substring(0, 200),
    datePublished: publishedTime,
    dateModified: modifiedTime,
  });

  const backLabel =
    locale === 'en' ? 'Back to topics' : '返回文章列表';
  const listHref = pathWithLocale('/blog', locale);

  const fallbackBanner =
    locale === 'en' && !hasEnBody ? (
      <div
        role="status"
        className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
      >
        This article does not have an English body yet. Showing the Chinese version below.
      </div>
    ) : null;

  return (
    <article className="retro-content" lang={useEn ? 'en' : 'zh-CN'}>
      <StructuredData data={jsonLd} />
      <header>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Link
            href={listHref}
            className="cursor-pointer rounded-md px-1 py-0.5 text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            {backLabel}
          </Link>
          <BlogDetailAdminEdit postId={post.id} />
        </p>
      </header>

      <div className="my-6 border-b border-border" role="presentation" />

      {fallbackBanner}

      <section
        className="article-main rounded-xl border border-border bg-card prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none p-4 sm:p-6"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      <section className="mt-8 border-t border-border/70 pt-6">
        <CommentsSection postId={post.id} />
      </section>
    </article>
  );
}
