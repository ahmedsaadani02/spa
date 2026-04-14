-- Migration 008: Fix image references in products and task_photo_proofs
-- Date: 2026-04-14
--
-- Context:
--   Before the lazy BACKEND_BASE_URL fix, the backend stored or returned full
--   localhost URLs (http://127.0.0.1:3001 or http://127.0.0.1:10000) in image
--   columns. Additionally, migration 006 stripped product image URLs down to
--   bare filenames (e.g. "filename.jpg") instead of the expected relative ref
--   format "product-images/filename.jpg", which resolveProductImageUrl cannot
--   resolve.
--
-- Goals:
--   1. products.image_url
--      a. Full http://*/api/product-images/X  → product-images/X
--      b. Bare filename.ext (left by migration 006) → product-images/filename.ext
--      c. Already-correct product-images/X    → no change
--   2. task_photo_proofs.image_ref
--      a. Full http://*/api/task-proof-images/X → task-proof-images/X
--      b. Already-correct task-proof-images/X   → no change
--
-- Safe to re-run (idempotent).

BEGIN;

-- ─── 1a. products: strip any full URL host, keep product-images/filename ──────
UPDATE products
SET image_url = 'product-images/' ||
  REGEXP_REPLACE(
    image_url,
    '^https?://[^/]+/api/product-images/',
    ''
  )
WHERE image_url IS NOT NULL
  AND image_url ~ '^https?://[^/]+/api/product-images/';

-- ─── 1b. products: fix bare filenames left by migration 006 ───────────────────
--  Matches values like "my-product-uuid.jpg" (extension, no slashes, no prefix)
UPDATE products
SET image_url = 'product-images/' || image_url
WHERE image_url IS NOT NULL
  AND image_url ~ '^[^/\\]+\.(png|jpg|jpeg|webp|gif|bmp)$'
  AND image_url NOT LIKE 'product-images/%'
  AND image_url NOT LIKE 'assets/%';

-- ─── 2. task_photo_proofs: strip any full URL host, keep task-proof-images/X ──
UPDATE task_photo_proofs
SET image_ref = 'task-proof-images/' ||
  REGEXP_REPLACE(
    image_ref,
    '^https?://[^/]+/api/task-proof-images/',
    ''
  )
WHERE image_ref IS NOT NULL
  AND image_ref ~ '^https?://[^/]+/api/task-proof-images/';

COMMIT;

-- ─── Verification queries (run manually to confirm 0 bad rows remain) ─────────
--
-- SELECT id, reference, image_url
-- FROM products
-- WHERE image_url IS NOT NULL
--   AND (
--     image_url ~ '^https?://'
--     OR (
--       image_url ~ '^[^/\\]+\.(png|jpg|jpeg|webp|gif|bmp)$'
--       AND image_url NOT LIKE 'assets/%'
--     )
--   );
-- Expected: 0 rows
--
-- SELECT id, task_id, image_ref
-- FROM task_photo_proofs
-- WHERE image_ref IS NOT NULL
--   AND image_ref ~ '^https?://';
-- Expected: 0 rows
