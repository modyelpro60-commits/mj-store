-- Normalize admin allowlist matching (case-insensitive + trim) and backfill existing profiles.
-- Also removes the hard-coded role check constraint so future roles can be introduced without schema changes.

begin;

-- 1) Make profiles.role extensible: remove strict role check constraint if it exists.
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

-- Keep default as 'customer' for now.
alter table public.profiles
  alter column role set default 'customer';

-- 2) Replace the trigger function: use lower(trim(...)) on both sides.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
as $$
declare
  is_admin boolean := false;
begin
  -- Allowlist match is case-insensitive and whitespace-tolerant
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
    case when is_admin then 'admin' else 'customer' end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = case when is_admin then 'admin' else 'customer' end;

  return new;
end;
$$;

-- 3) Backfill existing users: set admin role where email matches allowlist case-insensitively.
-- We only promote to admin; we do not demote non-matching roles to avoid clobbering any future RBAC roles.
update public.profiles p
set role = 'admin'
from public.admin_allowlist a
where p.email is not null
  and lower(trim(p.email)) = lower(trim(a.email))
  and p.role is distinct from 'admin';

commit;
