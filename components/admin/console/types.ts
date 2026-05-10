/**
 * Admin 控制台可切换的功能标签。
 */
export type TabKey = 'users' | 'posts' | 'photos' | 'comments';

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
  type: string;
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
