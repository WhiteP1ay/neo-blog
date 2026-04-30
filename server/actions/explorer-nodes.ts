'use server';

import { asc, eq, inArray, max } from 'drizzle-orm';
import { db } from '@/server/db/db';
import { explorerNodesTable, photosTable, postsTable } from '@/server/db/schema';
import { actionErr, actionOk, actionOkVoid } from '@/server/types/action-result';
import type { ActionResult, ActionVoidResult } from '@/server/types/action-result';
import type { ExplorerTreeNode, ExplorerNodeType } from '@/server/types/explorer-tree';
import type { ExplorerNode, Photo, Post } from '@/server/types/models';
import { getSession, requireAdminSession } from '@/server/utils/auth';
import { uploadImageToOss } from '@/server/utils/oss';
import { markdownToHTML } from '@/server/utils/markdown';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import { isMarkdownUpload } from '@/server/utils/upload-file';

const ROOT_CODE = 'root';
const EXTERNAL_POSTS_ROOT_CODE = 'external_posts_root';
const EXTERNAL_PHOTOS_ROOT_CODE = 'external_photos_root';
const SYSTEM_NOT_INITIALIZED_ERROR = '系统目录未初始化，请先执行 pnpm db:init';

/**
 * 校验父节点必须存在且为目录，避免生成“孤儿节点”导致树中不可见。
 */
async function assertFolderParent(parentId: number): Promise<ActionResult<void>> {
  const parent = await db.query.explorerNodesTable.findFirst({
    where: (n, { eq: eqFn }) => eqFn(n.id, parentId),
  });
  if (!parent) return actionErr('父目录不存在');
  if (parent.nodeType !== 'folder') return actionErr('父节点必须是目录');
  return actionOk(undefined);
}

async function getRootNode() {
  return db.query.explorerNodesTable.findFirst({
    where: (n, { and: andFn, eq: eqFn, isNull: isNullFn }) =>
      andFn(eqFn(n.nodeType, 'folder'), isNullFn(n.parentId), eqFn(n.code, ROOT_CODE)),
  });
}

async function getSystemFolderByCode(code: string) {
  return db.query.explorerNodesTable.findFirst({
    where: (n, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(n.code, code), eqFn(n.nodeType, 'folder')),
  });
}

export async function getSystemNodeIds(): Promise<ActionResult<{ postsRootNodeId: number; photosRootNodeId: number }>> {
  try {
    const root = await getRootNode();
    if (!root) return actionErr(SYSTEM_NOT_INITIALIZED_ERROR);
    const postsFolder = await getSystemFolderByCode(EXTERNAL_POSTS_ROOT_CODE);
    const photosFolder = await getSystemFolderByCode(EXTERNAL_PHOTOS_ROOT_CODE);
    if (!postsFolder || !photosFolder) return actionErr(SYSTEM_NOT_INITIALIZED_ERROR);
    return actionOk({
      postsRootNodeId: postsFolder.id,
      photosRootNodeId: photosFolder.id,
    });
  } catch (error) {
    console.error('获取系统目录失败:', error);
    return actionErr('获取系统目录失败');
  }
}

function buildTree(rows: ExplorerNode[], posts: Post[], photos: Photo[]): ExplorerTreeNode[] {
  const postMap = new Map<number, Post>();
  for (const post of posts) {
    if (post.nodeId != null) postMap.set(post.nodeId, post);
  }
  const photoMap = new Map<number, Photo>();
  for (const photo of photos) {
    photoMap.set(photo.nodeId, photo);
  }
  const map = new Map<number, ExplorerTreeNode>();
  const roots: ExplorerTreeNode[] = [];
  for (const r of rows) {
    const post = postMap.get(r.id);
    const photo = photoMap.get(r.id);
    map.set(r.id, {
      id: r.id,
      parentId: r.parentId ?? null,
      name: r.name,
      nodeType: r.nodeType as ExplorerNodeType,
      linkedPostId: post?.id ?? null,
      fileUrl: photo?.fileUrl ?? null,
      objectKey: photo?.objectKey ?? null,
      size: photo?.size ?? null,
      mimeType: photo?.mimeType ?? null,
      width: photo?.width ?? null,
      height: photo?.height ?? null,
      isHidden: r.isHidden,
      allowComment: r.allowComment,
      sortOrder: r.sortOrder,
      children: [],
    });
  }
  for (const node of map.values()) {
    if (node.parentId == null) {
      roots.push(node);
    } else {
      const parent = map.get(node.parentId);
      if (parent) parent.children.push(node);
    }
  }
  const sortRecursive = (nodes: ExplorerTreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    for (const node of nodes) sortRecursive(node.children);
  };
  sortRecursive(roots);
  return roots;
}

export async function getExplorerTree(): Promise<ActionResult<ExplorerTreeNode[]>> {
  try {
    const systemNodeResult = await getSystemNodeIds();
    if (!systemNodeResult.success) return actionErr(systemNodeResult.error);
    const rows = await db.select().from(explorerNodesTable).orderBy(asc(explorerNodesTable.parentId), asc(explorerNodesTable.sortOrder), asc(explorerNodesTable.id));
    const posts = await db.select().from(postsTable);
    const photos = await db.select().from(photosTable);
    return actionOk(buildTree(rows, posts, photos));
  } catch (error) {
    console.error('获取资源树失败:', error);
    return actionErr('获取资源树失败');
  }
}

export async function createFolder(parentId: number | null, name: string): Promise<ActionResult<ExplorerNode>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  const trimmed = name.trim();
  if (!trimmed) return actionErr('目录名不能为空');
  try {
    let pId = parentId;
    if (pId == null) {
      const rootResult = await getRootNodeId();
      if (!rootResult.success) return actionErr(rootResult.error);
      pId = rootResult.data;
    }
    const maxRow = await db.select({ m: max(explorerNodesTable.sortOrder) }).from(explorerNodesTable).where(eq(explorerNodesTable.parentId, pId));
    const nextSort = (maxRow[0]?.m ?? -1) + 1;
    const rows = await db.insert(explorerNodesTable).values({ parentId: pId, name: trimmed, nodeType: 'folder', sortOrder: nextSort }).returning();
    return actionOk(rows[0]);
  } catch (error) {
    console.error('创建目录失败:', error);
    return actionErr('创建目录失败');
  }
}

export async function createMarkdownFile(parentId: number, name: string): Promise<ActionResult<ExplorerNode>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  const trimmed = name.trim() || '无标题.md';
  try {
    const parentGate = await assertFolderParent(parentId);
    if (!parentGate.success) return actionErr(parentGate.error);
    const maxRow = await db.select({ m: max(explorerNodesTable.sortOrder) }).from(explorerNodesTable).where(eq(explorerNodesTable.parentId, parentId));
    const nextSort = (maxRow[0]?.m ?? -1) + 1;
    const nodeRows = await db
      .insert(explorerNodesTable)
      .values({
        parentId,
        name: trimmed,
        nodeType: 'markdown',
        sortOrder: nextSort,
      })
      .returning();
    await db.insert(postsTable).values({
      nodeId: nodeRows[0].id,
      title: trimmed.replace(/\.md$/i, ''),
      content: '<p></p>',
    });
    return actionOk(nodeRows[0]);
  } catch (error) {
    console.error('创建 Markdown 失败:', error);
    return actionErr('创建 Markdown 失败');
  }
}

export async function createPhotoFileFromForm(parentId: number, formData: FormData): Promise<ActionResult<ExplorerNode>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  try {
    const parentGate = await assertFolderParent(parentId);
    if (!parentGate.success) return actionErr(parentGate.error);
    const fileRaw = formData.get('file');
    if (!(fileRaw instanceof File)) return actionErr('未找到上传文件');
    if (isMarkdownUpload(fileRaw)) {
      // 兜底：上游分流判断失误时，仍可正确创建 markdown 节点。
      return createMarkdownFileFromForm(parentId, formData);
    }
    const titleRaw = formData.get('title');
    const title = typeof titleRaw === 'string' && titleRaw.trim() ? titleRaw.trim() : fileRaw.name;
    const uploaded = await uploadImageToOss(fileRaw, 'tree-photos');
    const maxRow = await db.select({ m: max(explorerNodesTable.sortOrder) }).from(explorerNodesTable).where(eq(explorerNodesTable.parentId, parentId));
    const nextSort = (maxRow[0]?.m ?? -1) + 1;
    const rows = await db
      .insert(explorerNodesTable)
      .values({
        parentId,
        name: title,
        nodeType: 'photo',
        sortOrder: nextSort,
      })
      .returning();
    await db.insert(photosTable).values({
      nodeId: rows[0].id,
      fileUrl: uploaded.url,
      objectKey: uploaded.objectKey,
      size: uploaded.size,
      mimeType: uploaded.mimeType,
      width: uploaded.width,
      height: uploaded.height,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return actionOk(rows[0]);
  } catch (error) {
    console.error('创建图片文件失败:', error);
    return actionErr(error instanceof Error ? error.message : '创建图片文件失败');
  }
}

export async function createMarkdownFileFromForm(parentId: number, formData: FormData): Promise<ActionResult<ExplorerNode>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  try {
    const parentGate = await assertFolderParent(parentId);
    if (!parentGate.success) return actionErr(parentGate.error);
    const fileRaw = formData.get('file');
    if (!(fileRaw instanceof File)) return actionErr('未找到上传文件');
    const text = await fileRaw.text();
    const titleRaw = formData.get('title');
    let title = typeof titleRaw === 'string' && titleRaw.trim() ? titleRaw.trim() : fileRaw.name;
    if (title.toLowerCase().endsWith('.md')) {
      title = title.slice(0, -3);
    }
    const firstLine = text.split('\n')[0]?.trim();
    if (firstLine?.startsWith('# ')) {
      title = firstLine.slice(2).trim() || title;
    }
    const htmlContent = markdownToHTML(text);
    const metadata = derivePostMetadata({
      markdownContent: text,
      content: htmlContent,
    });
    const maxRow = await db.select({ m: max(explorerNodesTable.sortOrder) }).from(explorerNodesTable).where(eq(explorerNodesTable.parentId, parentId));
    const nextSort = (maxRow[0]?.m ?? -1) + 1;
    const nodeRows = await db
      .insert(explorerNodesTable)
      .values({
        parentId,
        name: `${title}.md`,
        nodeType: 'markdown',
        sortOrder: nextSort,
      })
      .returning();
    await db.insert(postsTable).values({
      nodeId: nodeRows[0].id,
      title,
      content: htmlContent,
      markdownContent: text,
      coverUrl: metadata.coverUrl,
      excerpt: metadata.excerpt,
    });
    return actionOk(nodeRows[0]);
  } catch (error) {
    console.error('创建 Markdown 文件失败:', error);
    return actionErr('创建 Markdown 文件失败');
  }
}

export async function updateExplorerNode(
  id: number,
  data: { name?: string; isHidden?: boolean; allowComment?: boolean; parentId?: number | null },
): Promise<ActionResult<ExplorerNode>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  try {
    const updateData: Partial<ExplorerNode> = { updatedAt: new Date() };
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) return actionErr('名称不能为空');
      updateData.name = name;
    }
    if (data.isHidden !== undefined) updateData.isHidden = data.isHidden;
    if (data.allowComment !== undefined) updateData.allowComment = data.allowComment;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    const rows = await db.update(explorerNodesTable).set(updateData).where(eq(explorerNodesTable.id, id)).returning();
    if (rows.length === 0) return actionErr('节点不存在');
    return actionOk(rows[0]);
  } catch (error) {
    console.error('更新节点失败:', error);
    return actionErr('更新节点失败');
  }
}

export async function deleteExplorerNode(id: number): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  try {
    const node = await db.query.explorerNodesTable.findFirst({ where: (n, { eq: eqFn }) => eqFn(n.id, id) });
    if (!node) return actionErr('节点不存在');

    if (node.nodeType === 'markdown') {
      await db.delete(postsTable).where(eq(postsTable.nodeId, id));
    }
    if (node.nodeType === 'photo') {
      await db.delete(photosTable).where(eq(photosTable.nodeId, id));
    }
    await db.delete(explorerNodesTable).where(eq(explorerNodesTable.id, id));
    return actionOkVoid();
  } catch (error) {
    console.error('删除节点失败:', error);
    return actionErr('删除节点失败');
  }
}

export async function getRootNodeId(): Promise<ActionResult<number>> {
  try {
    const root = await getRootNode();
    if (!root) return actionErr(SYSTEM_NOT_INITIALIZED_ERROR);
    return actionOk(root.id);
  } catch (error) {
    console.error('获取根目录失败:', error);
    return actionErr('获取根目录失败');
  }
}

export async function getExplorerNodeById(id: number): Promise<ActionResult<ExplorerNode>> {
  try {
    const node = await db.query.explorerNodesTable.findFirst({
      where: (n, { eq: eqFn }) => eqFn(n.id, id),
    });
    if (!node) return actionErr('节点不存在');
    return actionOk(node);
  } catch (error) {
    console.error('获取节点失败:', error);
    return actionErr('获取节点失败');
  }
}

async function collectDescendantMarkdownPostIds(rootIds: number[]): Promise<number[]> {
  const allRows = await db.select().from(explorerNodesTable);
  const allPosts = await db.select({ id: postsTable.id, nodeId: postsTable.nodeId }).from(postsTable);
  const postIdByNode = new Map<number, number>();
  for (const post of allPosts) {
    if (post.nodeId != null) postIdByNode.set(post.nodeId, post.id);
  }
  const byParent = new Map<number | null, ExplorerNode[]>();
  for (const row of allRows) {
    const key = row.parentId ?? null;
    const group = byParent.get(key);
    if (group) group.push(row);
    else byParent.set(key, [row]);
  }
  const queue = [...rootIds];
  const seen = new Set<number>(rootIds);
  const postIds: number[] = [];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) break;
    const children = byParent.get(current) ?? [];
    for (const child of children) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      queue.push(child.id);
      if (child.nodeType === 'markdown') {
        const postId = postIdByNode.get(child.id);
        if (postId != null) postIds.push(postId);
      }
    }
  }
  const rootRows = allRows.filter((row) => rootIds.includes(row.id));
  for (const row of rootRows) {
    if (row.nodeType === 'markdown') {
      const postId = postIdByNode.get(row.id);
      if (postId != null) postIds.push(postId);
    }
  }
  return [...new Set(postIds)];
}

export async function moveExplorerNodes(input: {
  nodeIds: number[];
  targetParentId: number;
  targetIndex?: number;
}): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  const nodeIds = [...new Set(input.nodeIds)];
  if (nodeIds.length === 0) return actionErr('未选择节点');
  try {
    const target = await db.query.explorerNodesTable.findFirst({
      where: (n, { eq: eqFn }) => eqFn(n.id, input.targetParentId),
    });
    if (!target || target.nodeType !== 'folder') return actionErr('目标目录无效');

    await db.transaction(async (tx) => {
      const movingNodes = await tx
        .select()
        .from(explorerNodesTable)
        .where(inArray(explorerNodesTable.id, nodeIds))
        .orderBy(asc(explorerNodesTable.sortOrder), asc(explorerNodesTable.id));
      if (movingNodes.length !== nodeIds.length) throw new Error('部分节点不存在');

      const oldParentIds = [...new Set(movingNodes.map((node) => node.parentId).filter((v): v is number => v != null))];
      const targetChildren = await tx
        .select()
        .from(explorerNodesTable)
        .where(eq(explorerNodesTable.parentId, input.targetParentId))
        .orderBy(asc(explorerNodesTable.sortOrder), asc(explorerNodesTable.id));

      const insertIndex = Math.max(0, Math.min(input.targetIndex ?? targetChildren.length, targetChildren.length));
      const movedSet = new Set(nodeIds);
      const remaining = targetChildren.filter((child) => !movedSet.has(child.id));
      const inserted = [...remaining.slice(0, insertIndex), ...movingNodes, ...remaining.slice(insertIndex)];

      for (let i = 0; i < inserted.length; i++) {
        await tx
          .update(explorerNodesTable)
          .set({
            parentId: input.targetParentId,
            sortOrder: i,
            updatedAt: new Date(),
          })
          .where(eq(explorerNodesTable.id, inserted[i].id));
      }

      for (const parentId of oldParentIds) {
        if (parentId === input.targetParentId) continue;
        const siblings = await tx
          .select({ id: explorerNodesTable.id })
          .from(explorerNodesTable)
          .where(eq(explorerNodesTable.parentId, parentId))
          .orderBy(asc(explorerNodesTable.sortOrder), asc(explorerNodesTable.id));
        for (let i = 0; i < siblings.length; i++) {
          await tx
            .update(explorerNodesTable)
            .set({ sortOrder: i, updatedAt: new Date() })
            .where(eq(explorerNodesTable.id, siblings[i].id));
        }
      }
    });
    return actionOkVoid();
  } catch (error) {
    console.error('移动节点失败:', error);
    return actionErr(error instanceof Error ? error.message : '移动节点失败');
  }
}

export async function patchExplorerNodesBatch(input: {
  nodeIds: number[];
  isHidden?: boolean;
  allowComment?: boolean;
}): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  const nodeIds = [...new Set(input.nodeIds)];
  if (nodeIds.length === 0) return actionErr('未选择节点');
  if (input.isHidden === undefined && input.allowComment === undefined) return actionErr('未提供更新字段');
  try {
    const patch: { updatedAt: Date; isHidden?: boolean; allowComment?: boolean } = { updatedAt: new Date() };
    if (input.isHidden !== undefined) patch.isHidden = input.isHidden;
    if (input.allowComment !== undefined) patch.allowComment = input.allowComment;
    await db.update(explorerNodesTable).set(patch).where(inArray(explorerNodesTable.id, nodeIds));
    return actionOkVoid();
  } catch (error) {
    console.error('批量更新节点失败:', error);
    return actionErr('批量更新节点失败');
  }
}

export async function deleteExplorerNodesBatch(input: { nodeIds: number[] }): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  const nodeIds = [...new Set(input.nodeIds)];
  if (nodeIds.length === 0) return actionErr('未选择节点');
  try {
    const postIds = await collectDescendantMarkdownPostIds(nodeIds);
    await db.transaction(async (tx) => {
      if (postIds.length > 0) {
        await tx.delete(postsTable).where(inArray(postsTable.id, postIds));
      }
      await tx.delete(explorerNodesTable).where(inArray(explorerNodesTable.id, nodeIds));
    });
    return actionOkVoid();
  } catch (error) {
    console.error('批量删除节点失败:', error);
    return actionErr('批量删除节点失败');
  }
}

export async function getDanglingNodeStats(): Promise<ActionResult<{ markdownCount: number; photoCount: number; total: number }>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  try {
    const [nodes, posts, photos] = await Promise.all([
      db.select({ id: explorerNodesTable.id, nodeType: explorerNodesTable.nodeType }).from(explorerNodesTable),
      db.select({ nodeId: postsTable.nodeId }).from(postsTable),
      db.select({ nodeId: photosTable.nodeId }).from(photosTable),
    ]);
    const postNodeIds = new Set<number>();
    for (const post of posts) {
      if (post.nodeId != null) postNodeIds.add(post.nodeId);
    }
    const photoNodeIds = new Set<number>();
    for (const photo of photos) {
      photoNodeIds.add(photo.nodeId);
    }
    let markdownCount = 0;
    let photoCount = 0;
    for (const node of nodes) {
      if (node.nodeType === 'markdown' && !postNodeIds.has(node.id)) markdownCount += 1;
      if (node.nodeType === 'photo' && !photoNodeIds.has(node.id)) photoCount += 1;
    }
    return actionOk({ markdownCount, photoCount, total: markdownCount + photoCount });
  } catch (error) {
    console.error('统计脏节点失败:', error);
    return actionErr('统计脏节点失败');
  }
}

export async function cleanupDanglingNodes(): Promise<ActionResult<{ deleted: number }>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) return actionErr(gate.error);
  try {
    const [nodes, posts, photos] = await Promise.all([
      db.select({ id: explorerNodesTable.id, nodeType: explorerNodesTable.nodeType }).from(explorerNodesTable),
      db.select({ nodeId: postsTable.nodeId }).from(postsTable),
      db.select({ nodeId: photosTable.nodeId }).from(photosTable),
    ]);
    const postNodeIds = new Set<number>();
    for (const post of posts) {
      if (post.nodeId != null) postNodeIds.add(post.nodeId);
    }
    const photoNodeIds = new Set<number>();
    for (const photo of photos) {
      photoNodeIds.add(photo.nodeId);
    }
    const danglingIds: number[] = [];
    for (const node of nodes) {
      if (node.nodeType === 'markdown' && !postNodeIds.has(node.id)) danglingIds.push(node.id);
      if (node.nodeType === 'photo' && !photoNodeIds.has(node.id)) danglingIds.push(node.id);
    }
    if (danglingIds.length === 0) return actionOk({ deleted: 0 });
    await db.delete(explorerNodesTable).where(inArray(explorerNodesTable.id, danglingIds));
    return actionOk({ deleted: danglingIds.length });
  } catch (error) {
    console.error('清理脏节点失败:', error);
    return actionErr('清理脏节点失败');
  }
}

