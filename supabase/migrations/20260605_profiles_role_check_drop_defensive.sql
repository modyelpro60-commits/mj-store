-- Defensive removal of any CHECK constraint that restricts profiles.role to ('admin','customer').
-- This ensures future roles (manager/support/customer/etc.) can be added later without schema migration.

begin;

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.profiles'::regclass
      and c.contype = 'c'
      and (
        pg_get_constraintdef(c.oid) ilike '%role%'
        and pg_get_constraintdef(c.oid) ilike '%admin%'
        and pg_get_constraintdef(c.oid) ilike '%customer%'
      )
  loop
    execute format('alter table public.profiles drop constraint %I', r.conname);
  end loop;
end $$;

commit;
