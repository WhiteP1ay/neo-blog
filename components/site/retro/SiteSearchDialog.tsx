'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { SiteLocale } from '@/lib/site-locale';
import { localeFromPathname, pathWithLocale } from '@/lib/site-locale';
import { cn } from '@/lib/utils';

type SiteSearchDialogProps = {
  navButtonClass: string;
};

type SearchHit = {
  id: number;
  title: string;
  isPinned: boolean;
  createdAt: string | null;
  snippet: string | null;
};

const DEBOUNCE_MS = 300;

/**
 * 前台站内搜索：头部放大镜 + ⌘K / Ctrl+K 打开模态，请求 /api/search。
 */
export function SiteSearchDialog({ navButtonClass }: SiteSearchDialogProps) {
  const pathname = usePathname() ?? '/';
  const locale: SiteLocale = localeFromPathname(pathname);
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = query.trim();

  const labels =
    locale === 'en'
      ? {
          dialogTitle: 'Search posts',
          placeholder: 'Search posts…',
          hint: 'Enter keywords to search',
          none: (q: string) => `No results for "${q}"`,
          pinned: 'Pinned',
          buttonTitle: 'Search (⌘K)',
          buttonAria: 'Open search (Cmd+K)',
        }
      : {
          dialogTitle: '搜索文章',
          placeholder: '搜索文章…',
          hint: '输入关键词开始搜索',
          none: (q: string) => `未找到与「${q}」相关的文章`,
          pinned: '置顶',
          buttonTitle: '搜索（⌘K）',
          buttonAria: '打开搜索（⌘K）',
        };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'k') {
        return;
      }
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!trimmed) {
      setHits([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(() => {
      const url = `/api/search?q=${encodeURIComponent(trimmed)}`;
      fetch(url)
        .then(async (res) => {
          const body = (await res.json()) as { data?: SearchHit[]; error?: string };
          if (!res.ok) {
            throw new Error(body.error ?? 'Request failed');
          }
          return body.data ?? [];
        })
        .then((data) => {
          if (!cancelled) {
            setHits(data);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setHits([]);
            setError(err instanceof Error ? err.message : 'Search failed');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [open, trimmed]);

  const goToPost = useCallback(
    (id: number) => {
      router.push(pathWithLocale(`/blog/${id}`, locale));
      setOpen(false);
      setQuery('');
      setHits([]);
      setError(null);
    },
    [router, locale],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHits([]);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        className={cn(navButtonClass, 'gap-1.5')}
        title={locale === 'en' ? 'Search (⌘K / Ctrl+K)' : '搜索（⌘K / Ctrl+K）'}
        aria-label={labels.buttonAria}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search className="h-[1em] w-[1em] shrink-0 opacity-90" aria-hidden />
      </button>
      <DialogContent
        className="flex max-h-[85vh] max-w-xl flex-col gap-3 overflow-hidden p-0 sm:rounded-lg"
        showCloseButton
      >
        <DialogHeader className="space-y-0 border-b border-border px-4 py-3 pr-11 text-left">
          <DialogTitle className="sr-only">{labels.dialogTitle}</DialogTitle>
          <DialogDescription className="sr-only">{labels.placeholder}</DialogDescription>
          <input
            ref={inputRef}
            type="search"
            value={query}
            autoComplete="off"
            aria-label={labels.placeholder}
            placeholder={labels.placeholder}
            maxLength={100}
            className="w-full border-0 bg-transparent py-1 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
            onChange={(e) => setQuery(e.target.value)}
          />
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {!trimmed && <p className="px-2 py-10 text-center text-sm text-muted-foreground">{labels.hint}</p>}
          {trimmed && loading && (
            <p className="px-2 py-10 text-center text-sm text-muted-foreground">
              {locale === 'en' ? 'Searching…' : '搜索中…'}
            </p>
          )}
          {trimmed && !loading && error && <p className="px-2 py-10 text-center text-sm text-destructive">{error}</p>}
          {trimmed && !loading && !error && hits.length === 0 && (
            <p className="px-2 py-10 text-center text-sm text-muted-foreground">{labels.none(trimmed)}</p>
          )}
          {trimmed && !loading && !error && hits.length > 0 && (
            <div className="space-y-1">
              {hits.map((post) => (
                <div key={post.id}>
                  <button
                    type="button"
                    className="w-full rounded-md border border-transparent px-2 py-2.5 text-left hover:border-border hover:bg-accent/50 motion-safe:transition-colors"
                    onClick={() => goToPost(post.id)}
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex-1 text-sm font-semibold text-foreground">{post.title}</span>
                      {post.isPinned && (
                        <span className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400">
                          {labels.pinned}
                        </span>
                      )}
                    </div>
                    {post.snippet && (
                      <p
                        className="mt-1 line-clamp-2 text-xs text-muted-foreground [&_mark]:rounded [&_mark]:bg-amber-100 [&_mark]:text-foreground dark:[&_mark]:bg-amber-900/50"
                        // API 返回的 snippet 与全文检索一致，由服务端生成
                        dangerouslySetInnerHTML={{ __html: post.snippet }}
                      />
                    )}
                    {post.createdAt && (
                      <time
                        dateTime={new Date(post.createdAt).toISOString()}
                        className="mt-1 block text-xs text-muted-foreground/90"
                      >
                        {new Date(post.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
