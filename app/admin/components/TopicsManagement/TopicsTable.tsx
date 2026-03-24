'use client';

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

interface TopicsTableProps {
  topics: Topic[];
  onEdit: (topic: Topic) => void;
  onDelete: (id: number) => void;
  onToggleHidden: (topic: Topic) => void;
  onTogglePinned: (topic: Topic) => void;
  onRefresh: () => void;
}

/**
 * 专题表格组件
 */
export function TopicsTable({ topics, onEdit, onDelete, onToggleHidden, onTogglePinned }: TopicsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>置顶</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-[80px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  暂无专题
                </TableCell>
              </TableRow>
            ) : (
              topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{topic.name}</span>
                      {topic.isPinned && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
                          置顶
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                    {topic.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant={topic.isPinned ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => onTogglePinned(topic)}
                    >
                      {topic.isPinned ? '已置顶' : '置顶'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={topic.isHidden ? 'secondary' : 'default'}>
                      {topic.isHidden ? '已隐藏' : '显示中'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(topic.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="更多操作">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(topic)}>编辑</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleHidden(topic)}>
                          {topic.isHidden ? '显示' : '隐藏'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(topic.id)}
                        >
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
