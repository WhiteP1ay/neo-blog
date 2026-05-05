import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site/retro/SiteFooter';
import { SiteHeader } from '@/components/site/retro/SiteHeader';
import { DocContainer } from '@/components/site/retro/DocContainer';

/**
 * 复古站点布局：统一文档容器、头部导航与页脚。
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div id="top" className="retro-site min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main className="py-5 sm:py-8">
        <DocContainer>{children}</DocContainer>
      </main>
      <SiteFooter />
    </div>
  );
}
