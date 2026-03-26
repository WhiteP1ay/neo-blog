import type { HomeExplorerPostPreview } from "@/server/types/explorer";
import Link from "next/link";

interface PostListProps {
  posts: HomeExplorerPostPreview[];
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <p>暂无内容</p>
  }
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/blog/${post.id}`}>
            {post.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}