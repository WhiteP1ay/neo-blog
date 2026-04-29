import type { ExplorerTreeNode } from '@/server/types/explorer-tree';

export type TreeFlatNode = {
  id: number;
  parentId: number | null;
  depth: number;
  indexInParent: number;
  nodeType: ExplorerTreeNode['nodeType'];
};

function cloneNodes(nodes: ExplorerTreeNode[]): ExplorerTreeNode[] {
  return nodes.map((node) => ({ ...node, children: cloneNodes(node.children) }));
}

function walk(
  nodes: ExplorerTreeNode[],
  depth: number,
  parentId: number | null,
  visitor: (node: ExplorerTreeNode, depth: number, parentId: number | null, indexInParent: number) => void,
) {
  nodes.forEach((node, indexInParent) => {
    visitor(node, depth, parentId, indexInParent);
    walk(node.children, depth + 1, node.id, visitor);
  });
}

export function flattenTree(nodes: ExplorerTreeNode[]): TreeFlatNode[] {
  const flat: TreeFlatNode[] = [];
  walk(nodes, 0, null, (node, depth, parentId, indexInParent) => {
    flat.push({
      id: node.id,
      parentId,
      depth,
      indexInParent,
      nodeType: node.nodeType,
    });
  });
  return flat;
}

export function buildNodeMap(nodes: ExplorerTreeNode[]): Map<number, ExplorerTreeNode> {
  const map = new Map<number, ExplorerTreeNode>();
  walk(nodes, 0, null, (node) => {
    map.set(node.id, node);
  });
  return map;
}

type LocateResult = {
  siblings: ExplorerTreeNode[];
  index: number;
  parentId: number | null;
};

function locateNode(nodes: ExplorerTreeNode[], id: number, parentId: number | null = null): LocateResult | null {
  const index = nodes.findIndex((item) => item.id === id);
  if (index >= 0) {
    return { siblings: nodes, index, parentId };
  }
  for (const node of nodes) {
    const result = locateNode(node.children, id, node.id);
    if (result) return result;
  }
  return null;
}

function normalizeSortOrder(nodes: ExplorerTreeNode[]) {
  nodes.forEach((node, index) => {
    node.sortOrder = index;
  });
}

export function applyNodePatch(
  tree: ExplorerTreeNode[],
  ids: number[],
  patch: Partial<Pick<ExplorerTreeNode, 'isHidden' | 'allowComment'>>,
): ExplorerTreeNode[] {
  const idSet = new Set(ids);
  const next = cloneNodes(tree);
  walk(next, 0, null, (node) => {
    if (!idSet.has(node.id)) return;
    if (patch.isHidden !== undefined) node.isHidden = patch.isHidden;
    if (patch.allowComment !== undefined) node.allowComment = patch.allowComment;
  });
  return next;
}

export function removeNodes(tree: ExplorerTreeNode[], ids: number[]): ExplorerTreeNode[] {
  const idSet = new Set(ids);
  const removeRecursive = (nodes: ExplorerTreeNode[]): ExplorerTreeNode[] => {
    const filtered: ExplorerTreeNode[] = [];
    for (const node of nodes) {
      if (idSet.has(node.id)) continue;
      filtered.push({ ...node, children: removeRecursive(node.children) });
    }
    normalizeSortOrder(filtered);
    return filtered;
  };
  return removeRecursive(tree);
}

export function moveNodesToFolder(
  tree: ExplorerTreeNode[],
  movingIds: number[],
  targetFolderId: number,
): { tree: ExplorerTreeNode[]; targetIndex: number } | null {
  const next = cloneNodes(tree);
  const movingSet = new Set(movingIds);
  const nodesToMove: ExplorerTreeNode[] = [];

  for (const id of movingIds) {
    const located = locateNode(next, id);
    if (!located) return null;
    const [node] = located.siblings.splice(located.index, 1);
    nodesToMove.push(node);
    normalizeSortOrder(located.siblings);
  }

  const target = locateNode(next, targetFolderId);
  if (!target) return null;
  const targetNode = target.siblings[target.index];
  if (targetNode.nodeType !== 'folder') return null;
  if (movingSet.has(targetFolderId)) return null;

  const toInsert = nodesToMove.map((node) => ({ ...node, parentId: targetFolderId }));
  targetNode.children.push(...toInsert);
  normalizeSortOrder(targetNode.children);
  return { tree: next, targetIndex: Math.max(0, targetNode.children.length - toInsert.length) };
}

export function reorderWithinParent(
  tree: ExplorerTreeNode[],
  movingIds: number[],
  overId: number,
): { tree: ExplorerTreeNode[]; targetParentId: number | null; targetIndex: number } | null {
  const next = cloneNodes(tree);
  const overLocated = locateNode(next, overId);
  if (!overLocated) return null;
  const targetParentId = overLocated.parentId;

  const movingNodes: ExplorerTreeNode[] = [];
  for (const id of movingIds) {
    const located = locateNode(next, id);
    if (!located || located.parentId !== targetParentId) return null;
    const [node] = located.siblings.splice(located.index, 1);
    movingNodes.push(node);
  }

  const refreshed = locateNode(next, overId);
  if (!refreshed) return null;
  const insertIndex = refreshed.index;
  refreshed.siblings.splice(insertIndex, 0, ...movingNodes);
  normalizeSortOrder(refreshed.siblings);
  return { tree: next, targetParentId, targetIndex: insertIndex };
}

