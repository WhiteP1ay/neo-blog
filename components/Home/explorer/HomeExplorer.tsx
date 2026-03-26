'use client';

/**
 * Home Explorer：首页三栏主界面（编排层）。
 */

import type { HomeExplorerCategoryPayload, HomeExplorerPostDetailPayload } from '../type/payload';
import { ColumnResizeHandle } from './ColumnResizeHandle';
import { Footer } from './Footer';
import { Header } from './Header';
import { ExplorerModals } from './ExplorerModals';
import { PostListPanel } from './PostListPanel';
import { ReadingPane } from './ReadingPane';
import { ExplorerSettingsLayer } from './ExplorerSettingsLayer';
import { TopicPanel } from './TopicPanel';
import { useAdmin } from '../hooks/useAdmin';
import { useLayout } from '../hooks/useLayout';
import { useNavigation } from '../hooks/useNavigation';

export type { HomeExplorerCategoryPayload, HomeExplorerPostDetailPayload } from '../type/payload';

interface HomeExplorerProps {
  categories: HomeExplorerCategoryPayload[];
  activeTopicQuery: string;
  activePostId: number | null;
  postDetail: HomeExplorerPostDetailPayload | null;
  isAdminLoggedIn: boolean;
}

export function HomeExplorer({
  categories,
  activeTopicQuery,
  activePostId,
  postDetail,
  isAdminLoggedIn,
}: HomeExplorerProps) {

  const layout = useLayout();
  const nav = useNavigation(categories, activeTopicQuery);
  const admin = useAdmin({
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
      <Header isAdminLoggedIn={isAdminLoggedIn} />

      <div className="bg-muted/25 flex min-h-0 flex-1 gap-2.5 p-2.5 dark:bg-muted/20">
        <TopicPanel
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

        <PostListPanel
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

        <ColumnResizeHandle label="拖拽调整文章列表宽度" onResizeStart={layout.beginResizeList} />

        <ReadingPane
          postDetail={postDetail}
          isAdminLoggedIn={isAdminLoggedIn}
          onSavedEdit={() => {
            admin.setEditingPost(false);
            nav.refreshExplorer();
          }}
          onCancelEdit={() => admin.setEditingPost(false)}
        />
      </div>

      <Footer />

      <ExplorerModals
        submitNewTopic={admin.submitNewTopic}
        submitRenameTopic={admin.submitRenameTopic}
        submitDeleteTopic={admin.submitDeleteTopic}
        submitRenamePost={admin.submitRenamePost}
        submitDeletePost={admin.submitDeletePost}
      />

      <ExplorerSettingsLayer isAdminLoggedIn={isAdminLoggedIn} />
    </div>
  );
}

