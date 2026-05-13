import type { Metadata } from 'next';
import { AboutPageContent } from '@/app/(site)/about/AboutPageContent';

export const metadata: Metadata = {
  title: 'About',
  description: 'About White Meta and whitePlay',
};

export default function EnAboutPage() {
  return (
    <div className="retro-content max-w-prose" lang="en">
      <AboutPageContent />
    </div>
  );
}
