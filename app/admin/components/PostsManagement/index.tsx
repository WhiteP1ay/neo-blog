"use client";

import type { Post } from "@/server/actions/posts";
import { useFileUpload } from "./useFileUpload";
import { usePostActions } from "./usePostActions";
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

  const { handleDeletePost, handleDownloadPost, handleEditPost } =
    usePostActions(onRefresh);

  if (loading) {
    return <LoadingState />;
  }

  if (posts.length === 0) {
    return <EmptyState />;
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
        <PostsTable
          posts={posts}
          onEdit={handleEditPost}
          onDownload={handleDownloadPost}
          onDelete={handleDeletePost}
          onUpdate={startEdit}
        />

        <PostsCardList
          posts={posts}
          onEdit={handleEditPost}
          onDownload={handleDownloadPost}
          onDelete={handleDeletePost}
          onUpdate={startEdit}
        />
      </div>
    </div>
  );
}
