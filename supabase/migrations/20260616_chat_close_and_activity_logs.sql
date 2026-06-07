-- ─── Chat close/resolve + read tracking, and Activity Logs ──────────────────
begin;

-- ── chat_rooms: status + who closed + read tracking ──
alter table public.chat_rooms add column if not exists status               text        not null default 'open';
alter table public.chat_rooms add column if not exists closed_by            uuid        null references auth.users(id) on delete set null;
alter table public.chat_rooms add column if not exists closed_by_name       text        null;
alter table public.chat_rooms add column if not exists closed_at            timestamptz null;
alter table public.chat_rooms add column if not exists last_sender_is_staff boolean     not null default false;
alter table public.chat_rooms add column if not exists staff_last_read_at   timestamptz null;
alter table public.chat_rooms add column if not exists user_last_read_at    timestamptz null;

-- ── activity_logs: who did what (product create/update/delete, chat close…) ──
create table if not exists public.activity_logs (
  id           bigint      primary key generated always as identity,
  action       text        not null,
  actor_id     uuid        null references auth.users(id) on delete set null,
  actor_name   text        null,
  actor_role   text        null,
  target_type  text        null,
  target_id    text        null,
  target_label text        null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_activity_logs_created on public.activity_logs(created_at desc);

alter table public.activity_logs enable row level security;

-- Staff can read logs; inserts happen via the service role (bypasses RLS)
drop policy if exists "activity_logs_staff_select" on public.activity_logs;
create policy "activity_logs_staff_select"
  on public.activity_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator', 'helper')
    )
  );

commit;
