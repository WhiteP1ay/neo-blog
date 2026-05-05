import type { HomeExplorerPostPreview } from "@/server/types/explorer";
import Link from "next/link";

interface PostListProps {
  posts: HomeExplorerPostPreview[];
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无内容</p>;
  }
  return (
    <ul className="retro-paper space-y-2 rounded-sm p-4">
      {posts.map((post) => (
        <li key={post.id} className="ml-5 list-disc text-sm">
          <Link href={`/blog/${post.id}`} className="align-middle">
            {post.title}
          </Link>
          {/* <span className="ml-2 text-xs text-muted-foreground">
            {formatDate(post.createdAt)}
          </span> */}
        </li>
      ))}
    </ul>
  );
}

/**
 * 安全日期格式化：createdAt 为 null 时提供兜底展示。
 */
function formatDate(date: Date | null): string {
  if (!date) {
    return '未知日期';
  }
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
