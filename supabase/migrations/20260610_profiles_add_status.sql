-- Add user status (Active/Suspended/Banned) to profiles
-- Required by: /admin/users status management + badges

begin;

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
      add column status text not null default 'Active'
      check (status in ('Active','Suspended','Banned'));
  end if;
end
$$;

commit;
