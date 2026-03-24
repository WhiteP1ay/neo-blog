import type { Metadata } from 'next';
import { ToolsPageContent } from '@/app/components/tools/ToolsPageContent';

export const metadata: Metadata = {
  title: '工具与资源',
  description: '技术博客、简历编辑器、付费咨询等工具入口',
};

/**
 * 工具集合页（原首页底部工具区）
 */
export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-muted/40">
      <ToolsPageContent />
    </div>
  );
}
