/** 首页侧边列表用：仅必要字段 */
export type HomePostPreview = {
  id: number;
  title: string;
  createdAt: Date | null;
  isPinned: boolean;
};

/** 首页三栏：单篇列表项（含置顶标记） */
export type HomeExplorerPostPreview = {
  id: number;
  title: string;
  createdAt: Date | null;
  isPinned: boolean;
};

/**
 * 首页三栏：左侧分类；topicKey 为 0（虚拟未分类）或真实专题 id
 */
export type HomeExplorerCategory = {
  topicKey: number;
  name: string;
  isPinned: boolean;
  /** 未分类为 0；真实专题为库内 sortOrder */
  sortOrder: number;
  createdAt: Date | null;
  posts: HomeExplorerPostPreview[];
};
