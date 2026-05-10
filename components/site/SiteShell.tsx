import type { ReactNode } from 'react';
import { DocContainer } from '@/components/site/retro/DocContainer';
import { SiteFooter } from '@/components/site/retro/SiteFooter';
import { SiteHeader } from '@/components/site/retro/SiteHeader';

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div id="top" className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 py-8 sm:py-12">
        <DocContainer>{children}</DocContainer>
      </main>
      <SiteFooter />
    </div>
  );
}
