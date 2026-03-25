import type { Metadata } from 'next';
import { PrivacyPageContent } from '@/app/(site)/privacy/PrivacyPageContent';

export const metadata: Metadata = {
  title: '隐私政策',
  description: 'White Meta 博客隐私政策和 Cookie 政策',
};

export default function PrivacyPage() {
  return (
    <div className="bg-muted/40 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PrivacyPageContent />
      </div>
    </div>
  );
}
