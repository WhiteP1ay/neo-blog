ALTER TABLE "topics" ADD COLUMN "sortOrder" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
WITH ordered AS (
  SELECT id,
    (ROW_NUMBER() OVER (
      PARTITION BY "isPinned"
      ORDER BY "createdAt" DESC
    ) - 1) AS rn
  FROM topics
)
UPDATE topics t
SET "sortOrder" = o.rn
FROM ordered o
WHERE t.id = o.id;