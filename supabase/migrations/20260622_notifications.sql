-- Notifications system
-- Type audit (matches existing schema):
--   auth.users.id → uuid  (used for user_id FK)
--   notifications.id → bigint GENERATED ALWAYS AS IDENTITY
--     (same pattern as cart_items, chat_messages)
-- ─────────────────────────────────────────────────────────────────────────────

begin;

create table if not exists public.notifications (
  id         bigint      primary key generated always as identity,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  type       text        not null check (type in (
               'order_approved',
               'order_rejected',
               'new_message',
               'review_reply',
               'support_reply',
               'role_changed',
               'status_changed'
             )),
  title      text        not null,
  message    text        not null,
  link       text,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

-- Fast lookup: all notifications for a user, newest first
create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

-- Fast unread count per user
create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read)
  where is_read = false;

-- RLS
alter table public.notifications enable row level security;

-- Users can only read their own notifications
drop policy if exists "notifications_own_select" on public.notifications;
create policy "notifications_own_select"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can mark their own notifications as read
drop policy if exists "notifications_own_update" on public.notifications;
create policy "notifications_own_update"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role inserts (all server-side creates go through service key — bypasses RLS)

commit;
