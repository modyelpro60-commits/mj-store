-- USERS_DB_FIX: make live DB match the Admin Users Management UI/API expectations
-- Fixes:
-- 1) Add public.profiles.status (Active/Suspended/Banned)
-- 2) Set role default to 'user' and backfill roles:
--    - modyelpro60@gmail.com => admin
--    - customer -> user
--    - everything else not in allowed set => user
-- 3) Update public.handle_new_user_profile() trigger to assign role 'user' (unless allowlisted => 'admin')
-- 4) Backfill status for existing users to 'Active'

begin;

-- 0) Drop legacy role constraint first (so we can update rows without violations)
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
end $$;

-- 1) Add status column if missing
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'status'
  ) then
    alter table public.profiles
      add column status text not null default 'Active';
  end if;
end $$;

-- 2) Ensure check constraint exists (Active/Suspended/Banned)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('Active','Suspended','Banned'));
  end if;
end $$;

-- 3) Set default role to 'user'
alter table public.profiles
  alter column role set default 'user';

-- 4) Backfill roles BEFORE re-adding the role constraint
-- Allowlist -> admin
update public.profiles
set role = 'admin'
where email is not null
  and lower(trim(email)) = lower(trim('modyelpro60@gmail.com'));

-- Legacy customer -> user
update public.profiles
set role = 'user'
where role = 'customer';

-- Coerce any null/unknown role values to user to guarantee constraint validity
update public.profiles
set role = 'user'
where role is null
   or lower(role) not in ('user','helper','moderator','admin');

-- 5) Recreate role check constraint with required role set (now it will pass)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('user','helper','moderator','admin'));
  end if;
end $$;

-- 6) Backfill status
update public.profiles
set status = 'Active'
where status is null;

-- 7) Replace the profile creation trigger function to assign 'user' (unless allowlisted => 'admin')
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
as $$
declare
  is_admin boolean := false;
begin
  -- Admin allowlist by email (case-insensitive + trim)
  select exists(
    select 1
    from public.admin_allowlist a
    where lower(trim(a.email)) = lower(trim(new.email))
  )
  into is_admin;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    null,
    case when is_admin then 'admin' else 'user' end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = case when is_admin then 'admin' else 'user' end;

  return new;
end;
$$;

commit;
