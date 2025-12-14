ALTER TABLE "posts" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "createdAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "updatedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "updatedAt" DROP NOT NULL;