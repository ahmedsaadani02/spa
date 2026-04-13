-- Migration: Clean legacy task proof image URLs from task_photo_proofs table
-- Date: 2026-04-13
-- Description: Remove full localhost/domain URLs, keep only filenames or relative references

-- Step 1: Preview affected rows (run first to see what will be changed)
-- SELECT id, task_id, image_ref, file_name
-- FROM task_photo_proofs
-- WHERE image_ref IS NOT NULL
--   AND (
--     image_ref IN ('null', 'undefined', '')
--     OR image_ref ~ '^https?://'
--   )
-- ORDER BY created_at DESC;

-- Step 2: Clean the data in a transaction
BEGIN;

UPDATE task_photo_proofs
SET image_ref = CASE
  WHEN image_ref IN ('null', 'undefined', '') THEN NULL
  WHEN image_ref ~ '^https?://[^/]+/api/task-proof-images/' THEN REGEXP_REPLACE(
    image_ref,
    '^https?://[^/]+/api/task-proof-images/',
    ''
  )
  ELSE image_ref
END
WHERE image_ref IS NOT NULL;

COMMIT;

-- Step 3: Verify no bad rows remain (run after cleanup)
-- SELECT id, task_id, image_ref
-- FROM task_photo_proofs
-- WHERE image_ref IS NOT NULL 
--   AND (image_ref ~ '^https?://' OR image_ref IN ('null', 'undefined', ''));
-- Expected: 0 rows
