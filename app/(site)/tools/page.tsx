import type { Metadata } from 'next';
import { ToolsPageContent } from '@/app/(site)/tools/ToolsPageContent';

export const metadata: Metadata = {
  title: '工具与资源',
  description: '技术博客、简历编辑器、付费咨询等工具入口',
};

/**
 * 工具集合页（原首页底部工具区）
 */
export default function ToolsPage() {
  return (
    <main className="site-page">
      <div className="site-container">
        <ToolsPageContent />
      </div>
    </main>
  );
}
