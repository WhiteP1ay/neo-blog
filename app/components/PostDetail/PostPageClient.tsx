"use client";

import { CommentsSection } from "./CommentsSection";
import { usePageView } from "../Analytics";

interface PostPageClientProps {
  postId: number;
}

/**
 * 文章页客户端组件
 * 处理埋点和评论显示
 */
export function PostPageClient({ postId }: PostPageClientProps) {
  // 页面浏览埋点
  usePageView(`post_${postId}`);

  return <CommentsSection postId={postId} />;
}

