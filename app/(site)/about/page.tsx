import type { Metadata } from 'next';
import { AboutPageContent } from '@/app/(site)/about/AboutPageContent';

export const metadata: Metadata = {
  title: 'About',
  description: 'About White Meta',
};

export default function AboutPage() {
  return (
    <AboutPageContent />
  );
}
