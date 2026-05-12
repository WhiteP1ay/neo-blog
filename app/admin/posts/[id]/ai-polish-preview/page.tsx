import { notFound } from 'next/navigation';
import { AiPolishPreviewClient } from '@/components/admin/posts/AiPolishPreviewClient';

export default async function AiPolishPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number.parseInt(id, 10);
  if (!Number.isFinite(postId) || postId <= 0) {
    notFound();
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <AiPolishPreviewClient postId={postId} />
    </div>
  );
}
