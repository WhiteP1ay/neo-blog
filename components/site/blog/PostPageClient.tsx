'use client';

import { CommentsSection } from '@/components/site/blog/CommentsSection';
import { usePageView } from '@/hooks/useAnalytics';

interface PostPageClientProps {
  postId: number;
}

export function PostPageClient({ postId }: PostPageClientProps) {
  usePageView(`post_${postId}`);

  return <CommentsSection postId={postId} />;
}

