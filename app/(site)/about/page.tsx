import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/site/Breadcrumb';
import { AboutPageContent } from '@/app/(site)/about/AboutPageContent';

export const metadata: Metadata = {
  title: 'About',
  description: 'About White Meta',
};

export default function AboutPage() {
  return (
    <main className="site-page">
      <div className="site-container">
        <Breadcrumb />
        <AboutPageContent />
      </div>
    </main>
  );
}
