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
  topicKey: string;
  name: string;
  isPinned: boolean;
  /** 首页按 type 分组展示，不参与排序时可固定为 0 */
  sortOrder: number;
  createdAt: Date | null;
  posts: HomeExplorerPostPreview[];
};
