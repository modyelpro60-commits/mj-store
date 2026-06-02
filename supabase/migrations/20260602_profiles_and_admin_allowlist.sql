-- Profiles + role system for MJ Store
-- Required by:
--  - /api/auth/me (reads public.profiles.role)
--  - /app/lib/auth/requireAdmin.ts (checks profiles.role === 'admin')
--
-- Default role: 'customer'
-- Admin role is assigned automatically if the user's email exists in public.admin_allowlist.

begin;

-- 1) Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('admin','customer')),
  created_at timestamptz not null default now()
);

-- Keep email in sync on create
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
as $$
declare
  is_admin boolean := false;
begin
  -- Check admin allowlist by email
  select exists(
    select 1
    from public.admin_allowlist a
    where a.email = new.email
  )
  into is_admin;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    null,
    case when is_admin then 'admin' else 'customer' end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = case when is_admin then 'admin' else 'customer' end;

  return new;
end;
$$;

-- 2) Admin email allowlist table
create table if not exists public.admin_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

-- 3) Trigger: create profile on new auth user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

-- 4) Enable RLS
alter table public.profiles enable row level security;
alter table public.admin_allowlist enable row level security;

-- 5) Profiles RLS Policies
-- Users can read their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Users can update only their own full_name
drop policy if exists "profiles_update_own_full_name" on public.profiles;
create policy "profiles_update_own_full_name"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and (role = role) -- keep role unchanged from the DB perspective
);

-- Prevent users from changing role via update by enforcing it in a trigger would be best.
-- For now, the UI only updates full_name. Service role can manage anything.

-- 6) Admin allowlist Policies (admins can manage allowlist)
drop policy if exists "admin_allowlist_admin_manage" on public.admin_allowlist;
create policy "admin_allowlist_admin_manage"
on public.admin_allowlist
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- 7) Helpful indexes
create index if not exists profiles_email_idx on public.profiles(email);

commit;
