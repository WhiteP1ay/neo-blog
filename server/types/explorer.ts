/** 首页侧边列表用：仅必要字段 */
export type HomePostPreview = {
  id: number;
  title: string;
  createdAt: Date | null;
  isPinned: boolean;
};

/** 首页精选卡片：含摘要 / 封面 */
export type HomeFeaturedPost = {
  id: number;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  createdAt: Date | null;
  titleEn: string | null;
  excerptEn: string | null;
};

/** 首页三栏：单篇列表项（含置顶标记） */
export type HomeExplorerPostPreview = {
  id: number;
  title: string;
  createdAt: Date | null;
  isPinned: boolean;
  titleEn: string | null;
};

/**
 * 首页三栏：左侧分类；`typeCode` 对应 `post_types.code`，空串表示「未分类」桶。
 */
export type HomeExplorerCategory = {
  typeCode: string;
  name: string;
  isPinned: boolean;
  /** 首页按 type 分组展示，不参与排序时可固定为 0 */
  sortOrder: number;
  createdAt: Date | null;
  posts: HomeExplorerPostPreview[];
};
