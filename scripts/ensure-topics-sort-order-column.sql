-- 若 topics 尚无 sortOrder（与代码 schema 一致），则添加并回填。可重复执行。
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'topics'
      AND column_name = 'sortOrder'
  ) THEN
    ALTER TABLE "topics" ADD COLUMN "sortOrder" integer DEFAULT 0 NOT NULL;

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
  END IF;
END $$;
