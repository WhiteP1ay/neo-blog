'use client';

/**
 * 左侧专题栏：支持展开/收起、管理员拖拽排序/置顶/管理菜单。
 */

import { ColumnResizeHandle } from './ColumnResizeHandle';
import { TopicPanelHeader } from './TopicPanelHeader';
import { TopicPanelList } from './TopicPanelList';
import type { HomeExplorerCategoryPayload } from '../type/payload';
import { TOPIC_RAIL_PX } from '../constant/layout';
import { cn } from '@/lib/utils';
import { useLayoutStore } from '../store/layout';

export type TopicPanelProps = {
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

export function TopicPanel({
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
}: TopicPanelProps) {
  const sidebarPx = useLayoutStore((s) => s.sidebarPx);
  const topicPanelExpanded = useLayoutStore((s) => s.topicPanelExpanded);
  const setTopicPanelExpanded = useLayoutStore((s) => s.setTopicPanelExpanded);

  return (
    <>
      <div
        className="flex min-h-0 shrink-0 flex-col self-stretch transition-[width] duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
        style={{ width: topicPanelExpanded ? sidebarPx : TOPIC_RAIL_PX }}
      >
        <aside className="home-topic-glass-host flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" aria-label="分类">
          <div className="home-topic-glass-content flex min-h-0 flex-1 flex-col">
            <TopicPanelHeader
              expanded={topicPanelExpanded}
              isAdminLoggedIn={isAdminLoggedIn}
              onCollapse={() => setTopicPanelExpanded(false)}
              onExpand={() => setTopicPanelExpanded(true)}
              onCreateTopic={openNewTopicDialog}
            />
            <div
              className={cn(
                'grid min-h-0 flex-1 transition-[grid-template-rows] duration-340 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
                topicPanelExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <nav className="h-full min-h-0 overflow-x-hidden overflow-y-auto p-1.5" aria-hidden={!topicPanelExpanded}>
                  <ul className="flex flex-col gap-0.5">
                    <TopicPanelList
                      categories={categories}
                      activeTopicQuery={activeTopicQuery}
                      isAdminLoggedIn={isAdminLoggedIn}
                      navigateTopic={navigateTopic}
                      refreshExplorer={refreshExplorer}
                      showToast={showToast}
                      uncategorizedCategory={uncategorizedCategory}
                      pinnedTopicCategories={pinnedTopicCategories}
                      unpinnedTopicCategories={unpinnedTopicCategories}
                      handleToggleTopicPin={handleToggleTopicPin}
                      onRenameTopic={onRenameTopic}
                      onDeleteTopic={onDeleteTopic}
                    />
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </aside>
      </div>
      {topicPanelExpanded ? <ColumnResizeHandle label="拖拽调整专题栏宽度" onResizeStart={beginResizeSidebar} /> : null}
    </>
  );
}

