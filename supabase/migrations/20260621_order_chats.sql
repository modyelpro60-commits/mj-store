-- ─── Per-order chat threads + system messages ───────────────────────────────
begin;

-- Shared reference number across a checkout's order rows.
alter table public.orders add column if not exists order_ref text;
create index if not exists idx_orders_order_ref on public.orders(order_ref);

-- A chat room can belong to a specific order.
alter table public.chat_rooms add column if not exists order_ref text;
alter table public.chat_rooms add column if not exists title     text;
create index if not exists idx_chat_rooms_order_ref on public.chat_rooms(order_ref);

-- System messages (no human sender).
alter table public.chat_messages add column if not exists is_system boolean not null default false;
alter table public.chat_messages alter column sender_id drop not null;

-- Customers can now have multiple rooms (one general + one per order).
alter table public.chat_rooms drop constraint if exists chat_rooms_user_id_key;

commit;
