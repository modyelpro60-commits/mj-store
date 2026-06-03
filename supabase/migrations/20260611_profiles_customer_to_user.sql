-- Normalize profile roles to the Users Management spec:
-- User / Helper / Moderator / Admin
-- Existing system used 'customer' and 'admin'. Convert 'customer' -> 'user'.

begin;

-- 1) Change default role to 'user' (was previously 'customer' in trigger/column)
alter table public.profiles
  alter column role set default 'user';

-- 2) Backfill any existing 'customer' roles to 'user'
update public.profiles
set role = 'user'
where role = 'customer';

-- 3) Update profile creation trigger function to assign 'user' instead of 'customer'
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
as $$
declare
  is_admin boolean := false;
begin
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
