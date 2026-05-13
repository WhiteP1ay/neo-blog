'use client';

import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { HomeFeaturedItem } from '../types';

type HomeFeaturedAddDialogProps = {
  candidates: HomeFeaturedItem[];
  onAdd: (id: number) => Promise<void> | void;
};

/**
 * 「添加文章到首页精选」弹窗：搜索框 + 候选列表 + 一键加入。
 */
export function HomeFeaturedAddDialog({ candidates, onAdd }: HomeFeaturedAddDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return candidates;
    return candidates.filter((item) => {
      const typeStr = item.types.map((t) => `${t.nameZh} ${t.code}`).join(' ');
      const haystack = `${item.title} ${typeStr} ${item.excerpt ?? ''}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [candidates, query]);

  const handleAdd = async (id: number) => {
    await onAdd(id);
    // 添加后保持弹窗开启以便连续操作，但清空搜索词避免视觉错位。
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="cursor-pointer">
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          添加文章
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>添加到首页精选</DialogTitle>
          <DialogDescription>从未上首页的博文中挑选；点击「加入」后会排到精选末尾。</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded border border-input bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="按标题 / 分类 / 摘要搜索"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="搜索文章"
          />
        </div>

        <div className="max-h-80 overflow-y-auto rounded border">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {candidates.length === 0 ? '所有可见博文都已上首页。' : '没有匹配的文章。'}
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((item) => (
                <li key={item.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.types.length > 0 ? `类型：${item.types.map((t) => t.nameZh).join('、')}` : '未分类'}
                      {item.excerpt ? ` · ${item.excerpt}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => void handleAdd(item.id)}
                  >
                    加入
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
