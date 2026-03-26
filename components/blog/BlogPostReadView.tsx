'use client';

import { PostHeader } from '@/components/blog/PostHeader';
import { PostPageClient } from '@/components/blog/PostPageClient';
import type { HomeExplorerPostDetailPayload } from '@/components/Home';
import { CodeBlockCopyButtons } from '@/components/CodeBlockCopyButtons';

type BlogPostReadViewProps = {
  post: HomeExplorerPostDetailPayload;
};

export function BlogPostReadView({ post }: BlogPostReadViewProps) {
  const publishedTime = post.createdAt ?? undefined;

  return (
    <div key={post.id} className="p-4 sm:p-8">
      <article className="mx-auto max-w-3xl">
        <PostHeader
          title={post.title}
          createdAt={post.createdAt ? new Date(post.createdAt) : null}
          publishedTime={publishedTime}
        />
        <div
          className="prose prose-neutral dark:prose-invert prose-sm sm:prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
      <CodeBlockCopyButtons contentKey={`${post.id}-${post.contentSource.length}`} />
      <div className="mx-auto mt-8 max-w-3xl border-t border-border pt-6">
        <PostPageClient postId={post.id} />
      </div>
    </div>
  );
}
