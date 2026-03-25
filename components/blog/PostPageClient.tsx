'use client';

import { CommentsSection } from '@/components/blog/CommentsSection';
import { usePageView } from '@/components/Analytics';

interface PostPageClientProps {
  postId: number;
}

export function PostPageClient({ postId }: PostPageClientProps) {
  usePageView(`post_${postId}`);

  return <CommentsSection postId={postId} />;
}
