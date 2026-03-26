'use client';

/**
 * 左侧专题栏：支持展开/收起、管理员拖拽排序/置顶/管理菜单。
 */

import { PanelLeftClose, PanelRight, Plus } from 'lucide-react';
import { HomeExplorerTopicDndGroup } from './HomeExplorerSortables';
import { HomeExplorerAdminTopicRow } from './HomeExplorerAdminTopicRow';
import { HomeColumnResizeHandle } from './HomeColumnResizeHandle';
import type { HomeExplorerCategoryPayload } from '../type/home-explorer-payload';
import { TOPIC_RAIL_PX } from '../constant/home-explorer-layout';
import { topicToQueryValue } from '../utils/home-explorer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHomeExplorerLayoutStore } from '../store/home-explorer-layout-store';

type HomeExplorerTopicPanelProps = {
  categories: HomeExplorerCategoryPayload[];
  activeTopicQuery: string;
  isAdminLoggedIn: boolean;
  navigateTopic: (topicKey: number) => void;
  refreshExplorer: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  openNewTopicDialog: () => void;
  beginResizeSidebar: (clientX: number) => void;
  uncategorizedCategory: HomeExplorerCategoryPayload | undefined;
  pinnedTopicCategories: HomeExplorerCategoryPayload[];
  unpinnedTopicCategories: HomeExplorerCategoryPayload[];
  handleToggleTopicPin: (cat: HomeExplorerCategoryPayload) => void | Promise<void>;
  onRenameTopic: (id: number, name: string) => void;
  onDeleteTopic: (id: number) => void;
};

export function HomeExplorerTopicPanel({
  categories,
  activeTopicQuery,
  isAdminLoggedIn,
  navigateTopic,
  refreshExplorer,
  showToast,
  openNewTopicDialog,
  beginResizeSidebar,
  uncategorizedCategory,
  pinnedTopicCategories,
  unpinnedTopicCategories,
  handleToggleTopicPin,
  onRenameTopic,
  onDeleteTopic,
}: HomeExplorerTopicPanelProps) {
  const sidebarPx = useHomeExplorerLayoutStore((s) => s.sidebarPx);
  const topicPanelExpanded = useHomeExplorerLayoutStore((s) => s.topicPanelExpanded);
  const setTopicPanelExpanded = useHomeExplorerLayoutStore((s) => s.setTopicPanelExpanded);

  return (
    <>
      <div
        className="flex min-h-0 shrink-0 flex-col self-stretch transition-[width] duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
        style={{ width: topicPanelExpanded ? sidebarPx : TOPIC_RAIL_PX }}
      >
        <aside className="home-topic-glass-host flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" aria-label="分类">
          <div className="home-topic-glass-backdrop" aria-hidden />
          <div className="home-topic-glass-edge" aria-hidden />
          <div className="home-topic-glass-content flex min-h-0 flex-1 flex-col">
            <div
              className={cn(
                'flex shrink-0 items-center gap-1 border-b border-white/20 px-2 py-2 dark:border-white/10',
                topicPanelExpanded ? 'justify-between' : 'justify-center',
              )}
            >
              {topicPanelExpanded ? (
                <>
                  <div className="flex min-w-0 items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground size-8 shrink-0"
                      onClick={() => setTopicPanelExpanded(false)}
                      aria-label="收起专题栏"
                      title="收起专题栏"
                    >
                      <PanelLeftClose className="size-4" />
                    </Button>
                    <span className="text-muted-foreground truncate text-xs font-semibold uppercase tracking-wide">
                      专题
                    </span>
                  </div>
                  {isAdminLoggedIn ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      aria-label="新建专题"
                      title="新建专题"
                      onClick={openNewTopicDialog}
                    >
                      <Plus className="size-4" />
                    </Button>
                  ) : null}
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground size-9 shrink-0"
                  onClick={() => setTopicPanelExpanded(true)}
                  aria-label="展开专题栏"
                  title="展开专题栏"
                >
                  <PanelRight className="size-4" />
                </Button>
              )}
            </div>
            <div
              className={cn(
                'grid min-h-0 flex-1 transition-[grid-template-rows] duration-340 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
                topicPanelExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <nav
                  className="h-full min-h-0 overflow-x-hidden overflow-y-auto p-1.5"
                  aria-hidden={!topicPanelExpanded}
                >
                  <ul className="flex flex-col gap-0.5">
                    {!isAdminLoggedIn
                      ? categories.map((cat) => {
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
                        })
                      : null}
                    {isAdminLoggedIn && uncategorizedCategory ? (
                      <li key="topic-0">
                        <div
                          className={cn(
                            'group/topic flex w-full items-center gap-0.5 rounded-md',
                            topicToQueryValue(uncategorizedCategory.topicKey) === activeTopicQuery
                              ? 'bg-accent/80'
                              : 'hover:bg-accent/40',
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
                            aria-current={
                              topicToQueryValue(uncategorizedCategory.topicKey) === activeTopicQuery ? 'true' : undefined
                            }
                          >
                            <span className="min-w-0 flex-1 truncate">{uncategorizedCategory.name}</span>
                          </button>
                        </div>
                      </li>
                    ) : null}
                    {isAdminLoggedIn ? (
                      <>
                        <HomeExplorerTopicDndGroup
                          dndContextId="home-explorer-topics-pinned"
                          topics={pinnedTopicCategories}
                          activeTopicQuery={activeTopicQuery}
                          onOrderSaved={refreshExplorer}
                          showToast={showToast}
                          renderTopicRow={({ cat, isActive, dragHandle }) => (
                            <HomeExplorerAdminTopicRow
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
                        <HomeExplorerTopicDndGroup
                          dndContextId="home-explorer-topics-unpinned"
                          topics={unpinnedTopicCategories}
                          activeTopicQuery={activeTopicQuery}
                          onOrderSaved={refreshExplorer}
                          showToast={showToast}
                          renderTopicRow={({ cat, isActive, dragHandle }) => (
                            <HomeExplorerAdminTopicRow
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
                    ) : null}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </aside>
      </div>
      {topicPanelExpanded ? <HomeColumnResizeHandle label="拖拽调整专题栏宽度" onResizeStart={beginResizeSidebar} /> : null}
    </>
  );
}

