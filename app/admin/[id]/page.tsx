import { notFound, redirect } from 'next/navigation';
import { getPostById } from '@/server/actions/posts';
import { getSession } from '@/server/utils/auth';
import { PostEditForm } from '../components/PostEditForm';

/**
 * 文章编辑页面
 */
export default async function AdminPostPage({ params }: { params: Promise<{ id: string }> }) {
  // 检查登录状态
  const userId = await getSession();
  if (!userId) {
    redirect('/login');
  }

  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    notFound();
  }

  const result = await getPostById(postId);
  if (!result.success || !result.data) {
    notFound();
  }

  const post = result.data;

  return <PostEditForm post={post} />;
}
