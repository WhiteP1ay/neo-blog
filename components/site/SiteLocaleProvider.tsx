'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { localeFromPathname, type SiteLocale } from '@/lib/site-locale';

type SiteLocaleContextValue = {
  locale: SiteLocale;
};

const SiteLocaleContext = createContext<SiteLocaleContextValue | null>(null);

export function SiteLocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const value = useMemo<SiteLocaleContextValue>(
    () => ({ locale: localeFromPathname(pathname) }),
    [pathname],
  );
  return <SiteLocaleContext.Provider value={value}>{children}</SiteLocaleContext.Provider>;
}

export function useSiteLocale(): SiteLocaleContextValue {
  const ctx = useContext(SiteLocaleContext);
  if (!ctx) {
    return { locale: 'zh' };
  }
  return ctx;
}
