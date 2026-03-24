'use client';

import type { Post } from '@/server/actions/posts';
import type { Topic } from '@/server/actions/topics';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';

interface PostsTableProps {
  posts: Post[];
  postTopicsMap: Map<number, Topic[]>;
  onEdit: (id: number) => void;
  onDownload: (post: Post) => void;
  onDelete: (id: number) => void;
  onUpdate: (post: Post) => void;
  onTogglePinned: (post: Post) => void;
}

/**
 * 文章表格组件（桌面端）
 */
export function PostsTable({
  posts,
  postTopicsMap,
  onEdit,
  onDownload,
  onDelete,
  onUpdate,
  onTogglePinned,
}: PostsTableProps) {
  return (
    <div className="hidden sm:block overflow-x-auto rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>标题</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>所属专题</TableHead>
            <TableHead>置顶</TableHead>
            <TableHead className="w-[100px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => {
            const topics = postTopicsMap.get(post.id) || [];
            const isInTopics = topics.length > 0;

            return (
              <TableRow key={post.id}>
                <TableCell>
                  <Button variant="link" className="h-auto p-0 text-left font-normal" onClick={() => onEdit(post.id)}>
                    {post.title}
                  </Button>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString('zh-CN') : '-'}
                </TableCell>
                <TableCell>
                  {topics.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {topics.map((topic) => (
                        <Badge key={topic.id} variant="secondary">
                          {topic.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {!isInTopics ? (
                    <Button
                      type="button"
                      variant={post.isPinned ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => onTogglePinned(post)}
                    >
                      {post.isPinned ? '已置顶' : '置顶'}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8" aria-label="更多操作">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDownload(post)}>下载</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdate(post)}>更新</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(post.id)}
                      >
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
