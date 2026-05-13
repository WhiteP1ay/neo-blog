import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * 用户表
 */
export const usersTable = pgTable(
  'users',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    password: varchar({ length: 255 }).notNull(),
    isAdmin: boolean().notNull().default(false),
    isVip: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    nameUniqueIndex: uniqueIndex('users_name_unique_idx').on(table.name),
  }),
);

/**
 * 文章表
 */
export const postsTable = pgTable('posts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  sortOrder: integer().notNull().default(0),
  isHidden: boolean().notNull().default(false),
  content: text().notNull(), // 存储解析后的HTML
  markdownContent: text(), // 存储原始Markdown（可选，用于下载）
  coverUrl: text(), // 从正文中提取的首图 URL
  excerpt: text(), // 纯文本摘要（约 100 字）
  /** 英文标题（可选，用于 /en 路由） */
  titleEn: varchar({ length: 255 }),
  /** 英文正文 HTML（可选；与 content 分离，不再拼在中文底部） */
  contentEn: text(),
  /** 英文摘要（可选，由英文 HTML 派生） */
  excerptEn: text(),
  isPinned: boolean().notNull().default(false), // 是否置顶
  homeFeatured: boolean().notNull().default(false), // 是否上首页精选
  homeSortOrder: integer().notNull().default(0), // 首页精选内顺序（升序）
  createdAt: timestamp(), // 创建时间（可为空）
  updatedAt: timestamp(), // 修改时间（可为空）
});

/**
 * 文章类型（专题）：与 posts 多对多，通过 post_type_assignments。
 */
export const postTypesTable = pgTable(
  'post_types',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** 与 `?type=` 查询参数对应；唯一、非空，不作为路径段使用 */
    code: varchar({ length: 128 }).notNull(),
    nameZh: varchar({ length: 255 }).notNull(),
    nameEn: varchar({ length: 255 }).notNull(),
    sortOrder: integer().notNull().default(0),
    /** 为 true 时：凡关联该类型的文章从全站浏览数据（首页侧栏+专题列表）整篇排除 */
    suppressLinkedPostsGlobally: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    codeUniqueIndex: uniqueIndex('post_types_code_unique_idx').on(table.code),
  }),
);

/**
 * 文章与类型的多对多关联
 */
export const postTypeAssignmentsTable = pgTable(
  'post_type_assignments',
  {
    postId: integer()
      .notNull()
      .references(() => postsTable.id, { onDelete: 'cascade' }),
    typeId: integer()
      .notNull()
      .references(() => postTypesTable.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.typeId] }),
    typeIdx: index('post_type_assignments_type_idx').on(table.typeId),
  }),
);

/**
 * 照片表
 */
export const photosTable = pgTable('photos', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 50 }).notNull().default(''),
  isHidden: boolean().notNull().default(false),
  description: text(),
  coverUrl: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

/**
 * 评论表
 */
export const commentsTable = pgTable(
  'comments',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    targetType: varchar({ length: 16 }).notNull(), // post | photo
    targetId: integer().notNull(),
    parentId: integer(), // 回复的父评论ID，null表示顶级评论
    author: varchar({ length: 255 }).notNull(), // 评论者昵称
    email: varchar({ length: 255 }), // 邮箱（可选）
    content: text().notNull(),
    ip: varchar({ length: 45 }), // 存储IP地址
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    targetIndex: index('comments_target_idx').on(table.targetType, table.targetId),
    parentIndex: index('comments_parent_idx').on(table.parentId),
  }),
);

export const postsRelations = relations(postsTable, ({ many }) => ({
  typeAssignments: many(postTypeAssignmentsTable),
}));

export const postTypesRelations = relations(postTypesTable, ({ many }) => ({
  assignments: many(postTypeAssignmentsTable),
}));

export const postTypeAssignmentsRelations = relations(postTypeAssignmentsTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [postTypeAssignmentsTable.postId],
    references: [postsTable.id],
  }),
  type: one(postTypesTable, {
    fields: [postTypeAssignmentsTable.typeId],
    references: [postTypesTable.id],
  }),
}));
