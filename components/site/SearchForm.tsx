'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { SiteLocale } from '@/lib/site-locale';
import { pathWithLocale } from '@/lib/site-locale';

type SearchFormProps = {
  locale: SiteLocale;
  defaultQuery?: string;
  className?: string;
};

/**
 * 站内搜索（跳转至 /search 或 /en/search）
 */
export function SearchForm({ locale, defaultQuery = '', className = '' }: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const searchPath = pathWithLocale('/search', locale);
  const placeholder = locale === 'en' ? 'Search posts…' : '搜索文章…';
  const submitLabel = locale === 'en' ? 'Search' : '搜索';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push(searchPath);
      return;
    }
    router.push(`${searchPath}?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        maxLength={100}
        className="flex-1 min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={placeholder}
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 motion-safe:transition-opacity"
      >
        {submitLabel}
      </button>
    </form>
  );
}
