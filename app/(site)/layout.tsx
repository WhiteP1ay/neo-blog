import type { ReactNode } from 'react';
import { Nav } from '@/components/site/Nav';
import { Footer } from '@/components/site/Footer';
import './retro.css';
import { Breadcrumb } from '@/components/site/Breadcrumb';

/**
 * 除首页外的站点页：顶栏导航 + 页脚
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="site-page min-h-0 flex-1 overflow-auto py-4">
        <Breadcrumb />
        {children}
      </main>
      <Footer />
    </div>
  );
}
