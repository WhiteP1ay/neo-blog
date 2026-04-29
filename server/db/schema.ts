import { integer, pgTable, timestamp, varchar, text, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * 用户表
 */
export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  isAdmin: boolean().notNull().default(false),
  isVip: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => ({
  nameUniqueIndex: uniqueIndex('users_name_unique_idx').on(table.name),
}));

/**
 * 文章表
 */
export const postsTable = pgTable('posts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  nodeId: integer().references(() => explorerNodesTable.id, { onDelete: 'cascade' }),
  title: varchar({ length: 255 }).notNull(),
  content: text().notNull(), // 存储解析后的HTML
  markdownContent: text(), // 存储原始Markdown（可选，用于下载）
  coverUrl: text(), // 从正文中提取的首图 URL
  excerpt: text(), // 纯文本摘要（约 100 字）
  isPinned: boolean().notNull().default(false), // 是否置顶
  createdAt: timestamp(), // 创建时间（可为空）
  updatedAt: timestamp(), // 修改时间（可为空）
});

/**
 * 评论表
 */
export const commentsTable = pgTable('comments', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  targetType: varchar({ length: 16 }).notNull(), // post | album | photo
  targetId: integer().notNull(),
  parentId: integer(), // 回复的父评论ID，null表示顶级评论
  author: varchar({ length: 255 }).notNull(), // 评论者昵称
  email: varchar({ length: 255 }), // 邮箱（可选）
  content: text().notNull(),
  ip: varchar({ length: 45 }), // 存储IP地址
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => ({
  targetIndex: index('comments_target_idx').on(table.targetType, table.targetId),
  parentIndex: index('comments_parent_idx').on(table.parentId),
}));

/**
 * 埋点数据表
 */
export const analyticsTable = pgTable('analytics', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  type: varchar({ length: 50 }).notNull(), // 事件类型：page_view, comment, etc.
  action: varchar({ length: 100 }), // 具体操作
  target: varchar({ length: 255 }), // 目标：post_id, comment_id, etc.
  url: varchar({ length: 500 }), // 页面URL
  ip: varchar({ length: 45 }), // 用户IP
  userAgent: text(), // 用户代理
  metadata: text(), // JSON格式的额外数据
  createdAt: timestamp().notNull().defaultNow(),
});

/**
 * 资源管理树节点表（单根目录 + 任意层级）
 */
export const explorerNodesTable = pgTable(
  'explorer_nodes',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    parentId: integer(),
    code: varchar({ length: 64 }),
    name: varchar({ length: 255 }).notNull(),
    nodeType: varchar({ length: 20 }).notNull(), // folder | markdown | photo
    isHidden: boolean().notNull().default(false),
    allowComment: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    parentSortIndex: index('explorer_nodes_parent_sort_idx').on(table.parentId, table.sortOrder),
    typeIndex: index('explorer_nodes_type_idx').on(table.nodeType),
    codeUniqueIndex: uniqueIndex('explorer_nodes_code_unique_idx').on(table.code),
  }),
);

/**
 * 图片内容表：photo 节点的文件元信息。
 */
export const photosTable = pgTable(
  'photos',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    nodeId: integer()
      .notNull()
      .references(() => explorerNodesTable.id, { onDelete: 'cascade' }),
    fileUrl: text(),
    objectKey: varchar({ length: 500 }),
    size: integer(),
    mimeType: varchar({ length: 120 }),
    width: integer(),
    height: integer(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    nodeUniqueIndex: uniqueIndex('photos_node_unique_idx').on(table.nodeId),
  }),
);

export const postsRelations = relations(postsTable, ({ one }) => ({
  node: one(explorerNodesTable, {
    fields: [postsTable.nodeId],
    references: [explorerNodesTable.id],
  }),
}));

export const explorerNodesRelations = relations(explorerNodesTable, ({ one, many }) => ({
  parent: one(explorerNodesTable, {
    fields: [explorerNodesTable.parentId],
    references: [explorerNodesTable.id],
  }),
  children: many(explorerNodesTable),
  post: one(postsTable, {
    fields: [explorerNodesTable.id],
    references: [postsTable.nodeId],
  }),
  photo: one(photosTable, {
    fields: [explorerNodesTable.id],
    references: [photosTable.nodeId],
  }),
}));

export const photosRelations = relations(photosTable, ({ one }) => ({
  node: one(explorerNodesTable, {
    fields: [photosTable.nodeId],
    references: [explorerNodesTable.id],
  }),
}));
