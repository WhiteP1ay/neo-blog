'use client';

import { HomeFeaturedAddDialog } from './home/HomeFeaturedAddDialog';
import { HomeFeaturedDnd } from './home/HomeFeaturedDnd';
import { useHomeFeatured } from './home/useHomeFeatured';

const SOFT_LIMIT = 5;

/**
 * Admin 首页精选配置：拖拽排序 + 增删，建议保留 ≤ 5 篇。
 */
export function HomeFeaturedSection() {
  const { featured, candidates, loading, error, addFeatured, removeFeatured, reorder } = useHomeFeatured();
  const overLimit = featured.length > SOFT_LIMIT;

  return (
    <section className="space-y-3 rounded border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">首页精选</h2>
          <p className="text-xs text-muted-foreground">
            首页将展示这里的前 {SOFT_LIMIT} 篇，按当前顺序排列。
          </p>
        </div>
        <HomeFeaturedAddDialog candidates={candidates} onAdd={addFeatured} />
      </div>

      {loading ? <p className="text-sm text-muted-foreground">加载中...</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {overLimit ? (
        <p className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          已选 {featured.length} 篇，首页仍只展示前 {SOFT_LIMIT} 篇；多余条目可保留为「候补」，建议移除以保持简洁。
        </p>
      ) : null}

      <HomeFeaturedDnd items={featured} onReorder={reorder} onRemove={removeFeatured} />
    </section>
  );
}
