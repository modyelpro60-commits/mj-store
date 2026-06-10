-- Products v2 fields
-- Run this SQL directly in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to run multiple times (IF NOT EXISTS guards).
-- Real schema confirmed: id, name, description, image, price, sales_count, category,
--   badge, features, full_description, is_active, created_at
-- NOTE: There is NO 'status' column. Use is_active (boolean) for visibility.

-- 1. Add original_price column (for discount display)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS original_price NUMERIC NULL;

-- 2. Add short_description column (tagline shown on product page hero)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS short_description TEXT NULL;
