-- Make admin allowlist email matching case-insensitive
begin;

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
    where lower(a.email) = lower(new.email)
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

commit;
