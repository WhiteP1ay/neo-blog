'use client';

/**
 * 专题栏列表区域：非管理员普通列表 / 管理员（含未分类 + DnD）。
 *
 * 目标：
 * - 把 TopicPanel 的 JSX 体积压下去，只保留编排（header + list + resize handle）
 * - 按你要求：用 3 个分支的 if-return 组织逻辑
 */

import type { HomeExplorerCategoryPayload } from '../type/payload';
import { topicToQueryValue } from '../utils/explorer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TopicDndGroup } from './ExplorerSortables';
import { AdminTopicRow } from './AdminTopicRow';

export type TopicPanelListProps = {
  categories: HomeExplorerCategoryPayload[];
  activeTopicQuery: string;
  isAdminLoggedIn: boolean;
  navigateTopic: (topicKey: number) => void;
  refreshExplorer: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  uncategorizedCategory: HomeExplorerCategoryPayload | undefined;
  pinnedTopicCategories: HomeExplorerCategoryPayload[];
  unpinnedTopicCategories: HomeExplorerCategoryPayload[];
  handleToggleTopicPin: (cat: HomeExplorerCategoryPayload) => void | Promise<void>;
  onRenameTopic: (id: number, name: string) => void;
  onDeleteTopic: (id: number) => void;
};

export function TopicPanelList({
  categories,
  activeTopicQuery,
  isAdminLoggedIn,
  navigateTopic,
  refreshExplorer,
  showToast,
  uncategorizedCategory,
  pinnedTopicCategories,
  unpinnedTopicCategories,
  handleToggleTopicPin,
  onRenameTopic,
  onDeleteTopic,
}: TopicPanelListProps) {
  // 分支 1：非管理员
  if (!isAdminLoggedIn) {
    return (
      <>
        {categories.map((cat) => {
          const q = topicToQueryValue(cat.topicKey);
          const isActive = q === activeTopicQuery;
          return (
            <li key={q}>
              <div
                className={cn(
                  'group/topic flex w-full items-center gap-0.5 rounded-md',
                  isActive ? 'bg-accent/80' : 'hover:bg-accent/40',
                )}
              >
                <button
                  type="button"
                  onClick={() => navigateTopic(cat.topicKey)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                    isActive ? 'text-accent-foreground font-medium' : 'text-foreground/90',
                  )}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                  {cat.isPinned ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-500/40 px-1 py-0 text-[10px] text-amber-800 dark:text-amber-200"
                    >
                      置顶
                    </Badge>
                  ) : null}
                </button>
              </div>
            </li>
          );
        })}
      </>
    );
  }

  // 分支 2：管理员 + 有未分类
  if (uncategorizedCategory) {
    return (
      <>
        <li key="topic-0">
          <div
            className={cn(
              'group/topic flex w-full items-center gap-0.5 rounded-md',
              topicToQueryValue(uncategorizedCategory.topicKey) === activeTopicQuery ? 'bg-accent/80' : 'hover:bg-accent/40',
            )}
          >
            <button
              type="button"
              onClick={() => navigateTopic(uncategorizedCategory.topicKey)}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                topicToQueryValue(uncategorizedCategory.topicKey) === activeTopicQuery
                  ? 'text-accent-foreground font-medium'
                  : 'text-foreground/90',
              )}
              aria-current={topicToQueryValue(uncategorizedCategory.topicKey) === activeTopicQuery ? 'true' : undefined}
            >
              <span className="min-w-0 flex-1 truncate">{uncategorizedCategory.name}</span>
            </button>
          </div>
        </li>

        <TopicDndGroup
          dndContextId="home-explorer-topics-pinned"
          topics={pinnedTopicCategories}
          activeTopicQuery={activeTopicQuery}
          onOrderSaved={refreshExplorer}
          showToast={showToast}
          renderTopicRow={({ cat, isActive, dragHandle }) => (
            <AdminTopicRow
              cat={cat}
              isActive={isActive}
              dragHandle={dragHandle}
              onNavigate={() => navigateTopic(cat.topicKey)}
              onTogglePin={() => void handleToggleTopicPin(cat)}
              onRename={() => onRenameTopic(cat.topicKey, cat.name)}
              onDelete={() => onDeleteTopic(cat.topicKey)}
            />
          )}
        />
        <TopicDndGroup
          dndContextId="home-explorer-topics-unpinned"
          topics={unpinnedTopicCategories}
          activeTopicQuery={activeTopicQuery}
          onOrderSaved={refreshExplorer}
          showToast={showToast}
          renderTopicRow={({ cat, isActive, dragHandle }) => (
            <AdminTopicRow
              cat={cat}
              isActive={isActive}
              dragHandle={dragHandle}
              onNavigate={() => navigateTopic(cat.topicKey)}
              onTogglePin={() => void handleToggleTopicPin(cat)}
              onRename={() => onRenameTopic(cat.topicKey, cat.name)}
              onDelete={() => onDeleteTopic(cat.topicKey)}
            />
          )}
        />
      </>
    );
  }

  // 分支 3：管理员（无未分类）
  return (
    <>
      <TopicDndGroup
        dndContextId="home-explorer-topics-pinned"
        topics={pinnedTopicCategories}
        activeTopicQuery={activeTopicQuery}
        onOrderSaved={refreshExplorer}
        showToast={showToast}
        renderTopicRow={({ cat, isActive, dragHandle }) => (
          <AdminTopicRow
            cat={cat}
            isActive={isActive}
            dragHandle={dragHandle}
            onNavigate={() => navigateTopic(cat.topicKey)}
            onTogglePin={() => void handleToggleTopicPin(cat)}
            onRename={() => onRenameTopic(cat.topicKey, cat.name)}
            onDelete={() => onDeleteTopic(cat.topicKey)}
          />
        )}
      />
      <TopicDndGroup
        dndContextId="home-explorer-topics-unpinned"
        topics={unpinnedTopicCategories}
        activeTopicQuery={activeTopicQuery}
        onOrderSaved={refreshExplorer}
        showToast={showToast}
        renderTopicRow={({ cat, isActive, dragHandle }) => (
          <AdminTopicRow
            cat={cat}
            isActive={isActive}
            dragHandle={dragHandle}
            onNavigate={() => navigateTopic(cat.topicKey)}
            onTogglePin={() => void handleToggleTopicPin(cat)}
            onRename={() => onRenameTopic(cat.topicKey, cat.name)}
            onDelete={() => onDeleteTopic(cat.topicKey)}
          />
        )}
      />
    </>
  );
}

