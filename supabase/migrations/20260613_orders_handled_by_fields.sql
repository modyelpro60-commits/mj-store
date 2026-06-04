-- Add audit fields for order status handling (admin/moderator)
-- Backward compatible: nullable columns only.
--
-- Note:
-- Live DB inspection (via PostgREST) showed `orders` does not currently expose `created_at`
-- nor `handled_*` columns, so we also add `created_at`.
-- For existing rows, `created_at` will be set to the migration time via DEFAULT now().

alter table orders
  add column if not exists created_at timestamptz default now();

alter table orders
  add column if not exists handled_by uuid null;

alter table orders
  add column if not exists handled_by_name text null;

alter table orders
  add column if not exists handled_at timestamptz null;
