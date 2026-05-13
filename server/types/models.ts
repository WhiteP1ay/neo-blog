import type { InferSelectModel } from 'drizzle-orm';
import type { commentsTable, photosTable, postsTable } from '@/server/db/schema';

export type Post = InferSelectModel<typeof postsTable>;
export type Comment = InferSelectModel<typeof commentsTable>;
export type Photo = InferSelectModel<typeof photosTable>;
