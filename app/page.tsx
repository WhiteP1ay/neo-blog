import type { Metadata } from 'next';
import { HomePageContent } from '@/app/components/Home/Index';

export const metadata: Metadata = {
  title: 'White Meta',
  description: '白玩dev的个人网站',
  keywords: ['博客', '技术文章', '编程', '开发', '工具', '简历编辑器', '面试题库'],
  openGraph: {
    title: 'White Meta',
    description: '白玩dev的个人网站',
    type: 'website',
  },
};

/**
 * 首页 - 欢迎页
 */
export default function Home() {
  return <HomePageContent />;
}
