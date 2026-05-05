import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '博客',
  description: 'White Meta 博客 - 技术文章和编程分享',
  keywords: ['博客', '技术文章', '编程', '开发'],
  openGraph: {
    title: 'White Meta 博客',
    description: '技术文章和编程分享',
    type: 'website',
  },
};

export const revalidate = 60;

export default function BlogPage() {
  redirect('/');
}
