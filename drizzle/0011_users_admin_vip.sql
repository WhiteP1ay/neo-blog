ALTER TABLE "users" ADD COLUMN "isAdmin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isVip" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "users" SET "isAdmin" = true;