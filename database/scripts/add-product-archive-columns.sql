-- Add archive support to products for PostgreSQL
-- This script is safe to run on Neon/PostgreSQL and preserves existing rows.
BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_is_archived
  ON products (is_archived)
  WHERE is_deleted = FALSE;

COMMIT;
