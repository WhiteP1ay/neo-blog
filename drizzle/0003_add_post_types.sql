CREATE TABLE "post_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "post_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" varchar(128) NOT NULL,
	"nameZh" varchar(255) NOT NULL,
	"nameEn" varchar(255) NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"suppressLinkedPostsGlobally" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "post_types_slug_unique_idx" ON "post_types" USING btree ("slug");
--> statement-breakpoint
CREATE TABLE "post_type_assignments" (
	"postId" integer NOT NULL,
	"typeId" integer NOT NULL,
	CONSTRAINT "post_type_assignments_postId_typeId_pk" PRIMARY KEY("postId","typeId")
);
--> statement-breakpoint
ALTER TABLE "post_type_assignments" ADD CONSTRAINT "post_type_assignments_postId_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "post_type_assignments" ADD CONSTRAINT "post_type_assignments_typeId_post_types_id_fk" FOREIGN KEY ("typeId") REFERENCES "public"."post_types"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "post_type_assignments_type_idx" ON "post_type_assignments" USING btree ("typeId");
--> statement-breakpoint
INSERT INTO "post_types" ("slug", "nameZh", "nameEn", "sortOrder", "suppressLinkedPostsGlobally")
SELECT x.slug, x.slug, x.slug, (ROW_NUMBER() OVER (ORDER BY x.slug) - 1)::integer,
	(x.slug IN ('rei', 'asuka'))
FROM (SELECT DISTINCT "type" AS slug FROM "posts" WHERE "type" <> '') x;
--> statement-breakpoint
INSERT INTO "post_type_assignments" ("postId", "typeId")
SELECT p."id", t."id"
FROM "posts" p
INNER JOIN "post_types" t ON t."slug" = p."type"
WHERE p."type" <> '';
--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "type";
