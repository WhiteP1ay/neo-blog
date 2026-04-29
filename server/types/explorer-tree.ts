export type ExplorerNodeType = 'folder' | 'markdown' | 'photo';

export type ExplorerTreeNode = {
  id: number;
  parentId: number | null;
  name: string;
  nodeType: ExplorerNodeType;
  linkedPostId: number | null;
  fileUrl: string | null;
  objectKey: string | null;
  size: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  isHidden: boolean;
  allowComment: boolean;
  sortOrder: number;
  children: ExplorerTreeNode[];
};

