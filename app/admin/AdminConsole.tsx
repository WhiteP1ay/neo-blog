'use client';

import { CommentsPanel } from './console/panels/CommentsPanel';
import { PhotosPanel } from './console/panels/PhotosPanel';
import { PostsPanel } from './console/panels/PostsPanel';
import { UsersPanel } from './console/panels/UsersPanel';
import { TabNav } from './console/TabNav';
import type { TabKey } from './console/types';
import { useAdminConsole } from './console/useAdminConsole';

export function AdminConsole({
  initialTab = 'users',
  showTabNav = true,
}: {
  initialTab?: TabKey;
  showTabNav?: boolean;
}) {
  const consoleState = useAdminConsole(initialTab);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin 管理台</h1>
      {showTabNav ? <TabNav activeTab={consoleState.activeTab} onChange={consoleState.setActiveTab} /> : null}
      {consoleState.loading ? <p>加载中...</p> : null}
      {consoleState.error ? <p className="text-red-500">{consoleState.error}</p> : null}

      {consoleState.activeTab === 'users' ? <UsersPanel users={consoleState.users} form={consoleState.userForm} /> : null}
      {consoleState.activeTab === 'posts' ? <PostsPanel posts={consoleState.posts} form={consoleState.postForm} /> : null}
      {consoleState.activeTab === 'photos' ? <PhotosPanel photos={consoleState.photos} form={consoleState.photoForm} /> : null}
      {consoleState.activeTab === 'comments' ? <CommentsPanel comments={consoleState.comments} form={consoleState.commentForm} /> : null}
    </div>
  );
}
