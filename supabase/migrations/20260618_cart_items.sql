-- ─── Shopping cart ──────────────────────────────────────────────────────────
-- One row per (user, product). Quantity increments when re-added.
begin;

create table if not exists public.cart_items (
  id         bigint      primary key generated always as identity,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  product_id bigint      not null references public.products(id) on delete cascade,
  quantity   int         not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_cart_items_user on public.cart_items(user_id);

alter table public.cart_items enable row level security;

-- Owner can do everything with their own cart
drop policy if exists "cart_owner_all" on public.cart_items;
create policy "cart_owner_all"
  on public.cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
