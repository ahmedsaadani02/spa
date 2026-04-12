-- Migration: Clean legacy localhost image URLs from products table
-- Date: 2026-04-13
-- Description: Remove full URLs from image_url column, keeping only relative paths

UPDATE products
SET image_url = REGEXP_REPLACE(
  image_url,
  '^https?://[^/]+/api/product-images/',
  ''
)
WHERE image_url IS NOT NULL
  AND image_url ~ '^https?://';