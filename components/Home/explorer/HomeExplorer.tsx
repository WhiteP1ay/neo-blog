'use client';

/**
 * Home Explorer：首页三栏主界面（编排层）。
 *
 * 设计要点：
 * - 组件只负责编排布局与传参，业务逻辑下沉到 hooks/
 * - 子组件按区域拆分：header/topic/list/reading/modals/settings
 */

import type { HomeExplorerCategoryPayload, HomeExplorerPostDetailPayload } from '../type/home-explorer-payload';
import { HomeColumnResizeHandle } from './HomeColumnResizeHandle';
import { HomeExplorerFooter } from './HomeExplorerFooter';
import { HomeExplorerHeader } from './HomeExplorerHeader';
import { HomeExplorerModals } from './HomeExplorerModals';
import { HomeExplorerPostListPanel } from './HomeExplorerPostListPanel';
import { HomeExplorerReadingPane } from './HomeExplorerReadingPane';
import { HomeExplorerSettingsLayer } from './HomeExplorerSettingsLayer';
import { HomeExplorerTopicPanel } from './HomeExplorerTopicPanel';
import { useHomeExplorerAdmin } from '../hooks/useHomeExplorerAdmin';
import { useHomeExplorerLayout } from '../hooks/useHomeExplorerLayout';
import { useHomeExplorerNavigation } from '../hooks/useHomeExplorerNavigation';

export type { HomeExplorerCategoryPayload, HomeExplorerPostDetailPayload } from '../type/home-explorer-payload';

interface HomeExplorerProps {
  categories: HomeExplorerCategoryPayload[];
  activeTopicQuery: string;
  activePostId: number | null;
  postDetail: HomeExplorerPostDetailPayload | null;
  /** 已登录管理端 session 时在窗口内提供专题/文章 CRUD */
  isAdminLoggedIn: boolean;
}

/**
 * 首页三栏布局 + URL 与 router.replace 同步（占满浏览器内容区）
 */
export function HomeExplorer({
  categories,
  activeTopicQuery,
  activePostId,
  postDetail,
  isAdminLoggedIn,
}: HomeExplorerProps) {
  const layout = useHomeExplorerLayout();
  const nav = useHomeExplorerNavigation(categories, activeTopicQuery);
  const admin = useHomeExplorerAdmin({
    categories,
    activeCategory: nav.activeCategory,
    activePostId,
    activeTopicQuery,
    isAdminLoggedIn,
    refreshExplorer: nav.refreshExplorer,
    navigateTopic: nav.navigateTopic,
    navigatePost: nav.navigatePost,
    clearPostFromUrl: nav.clearPostFromUrl,
  });

  return (
    <div className="bg-card relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <HomeExplorerHeader isAdminLoggedIn={isAdminLoggedIn} />

      <div className="bg-muted/25 flex min-h-0 flex-1 gap-2.5 p-2.5 dark:bg-muted/20">
        <HomeExplorerTopicPanel
          categories={categories}
          activeTopicQuery={activeTopicQuery}
          isAdminLoggedIn={isAdminLoggedIn}
          navigateTopic={nav.navigateTopic}
          refreshExplorer={nav.refreshExplorer}
          showToast={admin.showToast}
          openNewTopicDialog={admin.openNewTopicDialog}
          beginResizeSidebar={layout.beginResizeSidebar}
          uncategorizedCategory={admin.uncategorizedCategory}
          pinnedTopicCategories={admin.pinnedTopicCategories}
          unpinnedTopicCategories={admin.unpinnedTopicCategories}
          handleToggleTopicPin={admin.handleToggleTopicPin}
          onRenameTopic={(id, name) => admin.setRenameTopicState({ id, name })}
          onDeleteTopic={(id) => admin.setDeleteTopicId(id)}
        />

        <HomeExplorerPostListPanel
          isAdminLoggedIn={isAdminLoggedIn}
          listDropHandlers={admin.listDropHandlers}
          activeCategory={nav.activeCategory}
          categories={categories}
          posts={nav.posts}
          activePostId={activePostId}
          uploadFileInputRef={admin.uploadFileInputRef}
          onUploadInputChange={admin.handleUploadMarkdownInput}
          onCreatePost={admin.handleCreatePost}
          onTriggerUploadClick={() => admin.uploadFileInputRef.current?.click()}
          navigatePost={nav.navigatePost}
          refreshExplorer={nav.refreshExplorer}
          showToast={admin.showToast}
          openPostEditor={admin.openPostEditor}
          handleTogglePostPin={admin.handleTogglePostPin}
          handleMovePost={admin.handleMovePost}
          onRenamePost={(id, title) => admin.setRenamePostState({ id, title })}
          onDeletePost={(id) => admin.setDeletePostId(id)}
        />

        <HomeColumnResizeHandle label="拖拽调整文章列表宽度" onResizeStart={layout.beginResizeList} />

        <HomeExplorerReadingPane
          postDetail={postDetail}
          isAdminLoggedIn={isAdminLoggedIn}
          onSavedEdit={() => {
            admin.setEditingPost(false);
            nav.refreshExplorer();
          }}
          onCancelEdit={() => admin.setEditingPost(false)}
        />
      </div>

      <HomeExplorerFooter />

      <HomeExplorerModals
        submitNewTopic={admin.submitNewTopic}
        submitRenameTopic={admin.submitRenameTopic}
        submitDeleteTopic={admin.submitDeleteTopic}
        submitRenamePost={admin.submitRenamePost}
        submitDeletePost={admin.submitDeletePost}
      />

      <HomeExplorerSettingsLayer isAdminLoggedIn={isAdminLoggedIn} />
    </div>
  );
}

