'use client';

import type { Post } from '@/server/actions/posts';
import type { Topic } from '@/server/actions/topics';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader } from '@/app/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Separator } from '@/app/components/ui/separator';

interface PostsCardListProps {
  posts: Post[];
  postTopicsMap: Map<number, Topic[]>;
  onEdit: (id: number) => void;
  onDownload: (post: Post) => void;
  onDelete: (id: number) => void;
  onUpdate: (post: Post) => void;
  onTogglePinned: (post: Post) => void;
}

/**
 * 文章卡片列表组件（移动端，与桌面表格同一套 shadcn 语义）
 */
export function PostsCardList({
  posts,
  postTopicsMap,
  onEdit,
  onDownload,
  onDelete,
  onUpdate,
  onTogglePinned,
}: PostsCardListProps) {
  return (
    <div className="space-y-3 px-1 pb-2 sm:hidden">
      {posts.map((post) => {
        const topics = postTopicsMap.get(post.id) || [];
        const isInTopics = topics.length > 0;

        return (
          <Card key={post.id} className="overflow-hidden shadow-sm">
            <CardHeader className="space-y-2 pb-2">
              <Button
                variant="link"
                className="h-auto min-h-0 justify-start p-0 text-left font-medium text-primary"
                onClick={() => onEdit(post.id)}
              >
                {post.title}
              </Button>
              {post.createdAt ? (
                <p className="text-muted-foreground text-xs">{new Date(post.createdAt).toLocaleDateString('zh-CN')}</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {topics.length > 0 ? (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">所属专题</p>
                  <div className="flex flex-wrap gap-1">
                    {topics.map((topic) => (
                      <Badge key={topic.id} variant="secondary">
                        {topic.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

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
              ) : null}

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <MoreHorizontal className="size-4" />
                      操作
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
