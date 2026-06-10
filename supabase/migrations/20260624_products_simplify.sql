-- Simplify products table for MJ Store (digital services)
-- Adds: original_price (optional, for discount display)
-- Adds: status column with new values (available / out_of_stock / coming_soon)
-- Existing rows get migrated to the new status system

-- 1. Add original_price column (nullable — only set when there's a discount)
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- 2. Add status column (defaults to 'available')
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available';

-- 3. Migrate any existing status values to the new system
--    published  → available
--    featured   → available
--    draft      → available
--    NULL       → available
UPDATE products
SET status = 'available'
WHERE status IS NULL
   OR status IN ('published', 'draft', 'featured');
