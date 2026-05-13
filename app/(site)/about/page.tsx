import type { Metadata } from 'next';
import { AboutPageContent } from './AboutPageContent';

export const metadata: Metadata = {
  title: '关于',
  description: '关于 White Meta 与白玩dev',
};

export default function AboutPage() {
  return (
    <div className="retro-content max-w-prose">
      <AboutPageContent locale="zh" />
    </div>
  );
}
