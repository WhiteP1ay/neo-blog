ALTER TABLE "posts" ADD COLUMN "homeFeatured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "homeSortOrder" integer DEFAULT 0 NOT NULL;
