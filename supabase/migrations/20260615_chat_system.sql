-- ─── Live Chat System ────────────────────────────────────────────────────────
-- One room per authenticated user. Staff can see all rooms.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- chat_rooms: one row per user (1-to-1 support chat)
create table if not exists public.chat_rooms (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null unique references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

-- chat_messages
create table if not exists public.chat_messages (
  id          bigint      primary key generated always as identity,
  room_id     uuid        not null references public.chat_rooms(id) on delete cascade,
  sender_id   uuid        not null references auth.users(id) on delete cascade,
  body        text        not null check (char_length(body) >= 1 and char_length(body) <= 2000),
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists idx_chat_messages_room_created on public.chat_messages(room_id, created_at);
create index if not exists idx_chat_rooms_last_msg        on public.chat_rooms(last_message_at desc);

-- RLS
alter table public.chat_rooms    enable row level security;
alter table public.chat_messages enable row level security;

-- chat_rooms policies
-- User can manage their own room
create policy "chat_rooms_user_all"
  on public.chat_rooms for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Staff can read all rooms
create policy "chat_rooms_staff_select"
  on public.chat_rooms for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator', 'helper')
    )
  );

-- chat_messages policies
-- User can select messages in their own room
create policy "chat_msg_user_select"
  on public.chat_messages for select
  using (
    room_id in (select id from public.chat_rooms where user_id = auth.uid())
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator', 'helper')
    )
  );

-- User can insert into their own room, staff can insert into any room
create policy "chat_msg_user_insert"
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
    and (
      room_id in (select id from public.chat_rooms where user_id = auth.uid())
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'moderator', 'helper')
      )
    )
  );

commit;
