import type { SiteLocale } from '@/lib/site-locale';

export function postListTitle(
  post: { title: string; titleEn: string | null },
  locale: SiteLocale,
): string {
  if (locale === 'en' && post.titleEn?.trim()) {
    return post.titleEn.trim();
  }
  return post.title;
}

export function featuredListTitle(
  post: { title: string; titleEn: string | null },
  locale: SiteLocale,
): string {
  return postListTitle(post, locale);
}

export function featuredExcerpt(
  post: { excerpt: string | null; excerptEn: string | null },
  locale: SiteLocale,
): string | null {
  if (locale === 'en' && post.excerptEn?.trim()) {
    return post.excerptEn.trim();
  }
  return post.excerpt;
}
