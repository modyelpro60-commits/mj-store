-- Migration: add user_id to public.orders
--
-- Links each order to the authenticated user who placed it.
-- Foreign key references auth.users(id) — consistent with public.profiles.
--
-- Idempotent: every statement uses IF NOT EXISTS / DO $$ guards.
-- Safe on a live table: nullable column, no back-fill here
-- (back-fill is handled by the separate backfill script).

begin;

-- ── 1. Add user_id column (nullable UUID) ─────────────────────────────────
do $$ begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'orders'
      and column_name  = 'user_id'
  ) then
    alter table public.orders
      add column user_id uuid null;
  end if;
end $$;

-- ── 2. Foreign key → auth.users(id) ──────────────────────────────────────
--    ON DELETE SET NULL: if the auth user is deleted the order row is kept
--    but user_id is cleared (preserves order history for admin).
do $$ begin
  if not exists (
    select 1
    from pg_constraint
    where conname      = 'orders_user_id_fkey'
      and conrelid     = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

-- ── 3. Index for fast per-user order queries ──────────────────────────────
create index if not exists orders_user_id_idx
  on public.orders(user_id)
  where user_id is not null;

-- ── 4. (Optional) partial index to quickly find un-linked legacy orders ───
create index if not exists orders_user_id_null_idx
  on public.orders(id)
  where user_id is null;

commit;
