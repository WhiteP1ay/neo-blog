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
    <>
      <Nav />
      <main className='mt-4 site-page'>
        <Breadcrumb />
        {children}
      </main>
      <Footer />
    </>
  );
}
