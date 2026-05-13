/**
 * Admin 控制台可切换的功能标签。
 */
export type TabKey = 'users' | 'posts' | 'post-types' | 'photos' | 'comments' | 'home';

/** 博文 / 精选卡片上展示的轻量类型信息 */
export type PostTypeSummary = {
  id: number;
  code: string;
  nameZh: string;
  nameEn: string;
};

/**
 * 首页精选条目（含拖拽排序所需的字段）。
 */
export type HomeFeaturedItem = {
  id: number;
  title: string;
  types: PostTypeSummary[];
  excerpt: string | null;
  coverUrl: string | null;
};

/**
 * 用户条目模型。
 */
export type UserItem = {
  id: number;
  name: string;
  isAdmin: boolean;
};

/**
 * 博文列表条目（轻量）。
 * 列表接口为提速，不返回 content / markdownContent；编辑时通过详情接口按需获取。
 */
export type PostItem = {
  id: number;
  title: string;
  types: PostTypeSummary[];
  sortOrder: number;
  isHidden: boolean;
  excerpt: string | null;
  coverUrl: string | null;
};

/**
 * 博文详情条目（含完整正文），仅用于编辑场景。
 */
export type PostDetail = PostItem & {
  content: string;
  markdownContent: string | null;
  titleEn: string | null;
  contentEn: string | null;
  excerptEn: string | null;
};

/** Admin 类型管理行（与 `/api/admin/post-types` 对齐） */
export type PostTypeAdminRow = {
  id: number;
  code: string;
  nameZh: string;
  nameEn: string;
  sortOrder: number;
  suppressLinkedPostsGlobally: boolean;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

/**
 * 照片条目模型。
 */
export type PhotoItem = {
  id: number;
  title: string;
  type: string;
  isHidden: boolean;
  coverUrl: string | null;
  description: string | null;
};

/**
 * 评论条目模型。
 */
export type CommentItem = {
  id: number;
  targetType: string;
  targetId: number;
  author: string;
  content: string;
};
