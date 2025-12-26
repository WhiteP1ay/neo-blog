"use client";

import type { Post } from "@/server/actions/posts";
import { useFileUpload } from "./useFileUpload";
import { usePostActions } from "./usePostActions";
import { usePostTopics } from "./hooks/usePostTopics";
import { FileUploadZone } from "./FileUploadZone";
import { PostsTable } from "./PostsTable";
import { PostsCardList } from "./PostsCardList";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";

interface PostsManagementProps {
  posts: Post[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * 文章管理组件
 */
export function PostsManagement({
  posts,
  loading,
  onRefresh,
}: PostsManagementProps) {
  const {
    fileInputRef,
    dropZoneRef,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    startEdit,
    startCreate,
  } = useFileUpload(onRefresh);

  const { handleDeletePost, handleDownloadPost, handleEditPost, handleTogglePinned } =
    usePostActions(onRefresh);

  const postTopicsMap = usePostTopics(posts);

  if (loading) {
    return <LoadingState />;
  }


  return (
    <div>
      <FileUploadZone
        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
        dropZoneRef={dropZoneRef as React.RefObject<HTMLInputElement>}
        onFileSelect={handleFileSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onCreateClick={startCreate}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {posts.length > 0 ? (
          <>
            <PostsTable
              posts={posts}
              postTopicsMap={postTopicsMap}
              onEdit={handleEditPost}
              onDownload={handleDownloadPost}
              onDelete={handleDeletePost}
              onUpdate={startEdit}
              onTogglePinned={handleTogglePinned}
            />
            <PostsCardList
              posts={posts}
              postTopicsMap={postTopicsMap}
              onEdit={handleEditPost}
              onDownload={handleDownloadPost}
              onDelete={handleDeletePost}
              onUpdate={startEdit}
              onTogglePinned={handleTogglePinned}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
