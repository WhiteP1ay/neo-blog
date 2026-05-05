import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Admin',
  description: '后台管理',
};

export default async function AdminPage() {
  redirect('/admin/users');
}
