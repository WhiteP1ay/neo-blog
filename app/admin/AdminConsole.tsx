'use client';

import { CommentsSection } from './console/components/CommentsSection';
import { PhotosSection } from './console/components/PhotosSection';
import { PostsSection } from './console/components/PostsSection';
import { UsersSection } from './console/components/UsersSection';
import { TabNav } from './console/TabNav';
import type { TabKey } from './console/types';
import { useAdminConsole } from './console/useAdminConsole';

export function AdminConsole({
  initialTab = 'posts',
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

      {consoleState.activeTab === 'posts' ? <PostsSection posts={consoleState.posts} form={consoleState.postForm} /> : null}
      {consoleState.activeTab === 'photos' ? <PhotosSection photos={consoleState.photos} form={consoleState.photoForm} /> : null}
      {consoleState.activeTab === 'users' ? <UsersSection users={consoleState.users} form={consoleState.userForm} /> : null}
      {consoleState.activeTab === 'comments' ? <CommentsSection comments={consoleState.comments} form={consoleState.commentForm} /> : null}
    </div>
  );
}
