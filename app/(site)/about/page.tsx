import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/Breadcrumb';
import { AboutPageContent } from '@/components/about/AboutPageContent';

export const metadata: Metadata = {
  title: 'About',
  description: 'About White Meta',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-12">
        <Breadcrumb />
        <AboutPageContent />
      </div>
    </div>
  );
}
