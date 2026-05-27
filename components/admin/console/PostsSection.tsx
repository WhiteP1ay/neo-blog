'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PostItem, PostTypeAdminRow } from './types';
import { ZenPostEditor } from '@/components/admin/ZenPostEditor';
import { PostAiPolishDialog } from './posts/PostAiPolishDialog';
import { PostBulkAiPolishDialog } from './posts/PostBulkAiPolishDialog';
import { PostBulkDeleteDialog } from './posts/PostBulkDeleteDialog';
import { PostBulkTypeDialog } from './posts/PostBulkTypeDialog';
import { PostTable } from './posts/PostTable';

type PostFormState = {
  uploadPostFile: (file: File) => Promise<void>;
  togglePostHidden: (item: PostItem) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  reorderPosts: (orderedIds: number[], typeId: number) => Promise<void>;
  bulkReplacePostTypes: (postIds: number[], typeIds: number[]) => Promise<void>;
  bulkDeletePosts: (postIds: number[]) => Promise<void>;
  bulkSetPostsHidden: (postIds: number[], isHidden: boolean) => Promise<void>;
  bulkAiPolishPosts: (
    postIds: number[],
    options: { polishCn: boolean; translateAppendEn: boolean },
    onProgress?: (current: number, total: number) => void,
  ) => Promise<{ ok: number; failed: Array<{ postId: number; error: string }> }>;
};

export function PostsSection({
  posts,
  postTypes,
  form,
  selectedType = null,
}: {
  posts: PostItem[];
  postTypes: PostTypeAdminRow[];
  form: PostFormState;
  selectedType?: string | null;
}) {
  const queryClient = useQueryClient();
  const [openZenCreate, setOpenZenCreate] = useState(false);
  const [aiPolishPost, setAiPolishPost] = useState<PostItem | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<number>>(() => new Set());
  const [bulkTypeOpen, setBulkTypeOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkPolishOpen, setBulkPolishOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [polishProgress, setPolishProgress] = useState<{ current: number; total: number } | null>(null);
  const mdFileInputRef = useRef<HTMLInputElement>(null);

  const postIdSet = useMemo(() => new Set(posts.map((p) => p.id)), [posts]);

  useEffect(() => {
    setSelectedPostIds((prev) => {
      const next = new Set<number>();
      for (const id of prev) {
        if (postIdSet.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [postIdSet]);

  const invalidatePosts = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
  };

  const selectedPosts = useMemo(() => posts.filter((p) => selectedPostIds.has(p.id)), [posts, selectedPostIds]);
  const selectedIdList = useMemo(() => [...selectedPostIds], [selectedPostIds]);

  const clearSelection = useCallback(() => setSelectedPostIds(new Set()), []);

  const togglePostSelected = useCallback((postId: number) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback((ids: number[]) => {
    setSelectedPostIds((prev) => new Set([...prev, ...ids]));
  }, []);

  const deselectVisible = useCallback((ids: number[]) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }, []);

  const postTableForm = {
    ...form,
    openAiPolish: (post: PostItem) => setAiPolishPost(post),
  };

  const runBulk = async (fn: () => Promise<void>) => {
    setBulkBusy(true);
    try {
      await fn();
      clearSelection();
    } finally {
      setBulkBusy(false);
      setPolishProgress(null);
    }
  };

  return (
    <section className="space-y-3 rounded border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">博文管理</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setOpenZenCreate(true)}>
            新增博文
          </button>
          <button
            className="rounded border px-3 py-1 text-sm"
            type="button"
            onClick={() => mdFileInputRef.current?.click()}
          >
            上传 Markdown
          </button>
          <input
            ref={mdFileInputRef}
            type="file"
            accept=".md,text/markdown"
            className="sr-only"
            aria-hidden
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void form.uploadPostFile(file);
              event.target.value = '';
            }}
          />
        </div>
      </div>

      <PostTable
        posts={posts}
        typeCatalog={postTypes}
        form={postTableForm}
        selectedType={selectedType}
        selectedPostIds={selectedPostIds}
        onTogglePostSelected={togglePostSelected}
        onSelectAllVisible={selectAllVisible}
        onDeselectVisible={deselectVisible}
        onClearSelection={clearSelection}
        bulkBusy={bulkBusy}
        polishProgress={polishProgress}
        onOpenBulkType={() => setBulkTypeOpen(true)}
        onOpenBulkDelete={() => setBulkDeleteOpen(true)}
        onOpenBulkPolish={() => setBulkPolishOpen(true)}
        onBulkShow={() =>
          void runBulk(async () => {
            await form.bulkSetPostsHidden(selectedIdList, false);
          })
        }
        onBulkHide={() =>
          void runBulk(async () => {
            await form.bulkSetPostsHidden(selectedIdList, true);
          })
        }
      />

      <PostAiPolishDialog
        post={aiPolishPost}
        open={aiPolishPost !== null}
        onOpenChange={(next) => {
          if (!next) setAiPolishPost(null);
        }}
      />

      <PostBulkTypeDialog
        open={bulkTypeOpen}
        onOpenChange={setBulkTypeOpen}
        selectedCount={selectedIdList.length}
        availableTypes={postTypes}
        onConfirm={async (typeIds) => {
          await form.bulkReplacePostTypes(selectedIdList, typeIds);
          clearSelection();
        }}
      />

      <PostBulkDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        selectedPosts={selectedPosts}
        onConfirm={async () => {
          await form.bulkDeletePosts(selectedIdList);
          clearSelection();
        }}
      />

      <PostBulkAiPolishDialog
        open={bulkPolishOpen}
        onOpenChange={setBulkPolishOpen}
        selectedCount={selectedIdList.length}
        onConfirm={async (options) => {
          setBulkBusy(true);
          try {
            await form.bulkAiPolishPosts(selectedIdList, options, (current, total) => {
              setPolishProgress({ current, total });
            });
            clearSelection();
          } finally {
            setBulkBusy(false);
            setPolishProgress(null);
          }
        }}
      />

      <ZenPostEditor
        mode="create"
        open={openZenCreate}
        availableTypes={postTypes}
        onClose={() => setOpenZenCreate(false)}
        onCreated={invalidatePosts}
      />
    </section>
  );
}
