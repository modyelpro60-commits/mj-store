-- Seed + backfill admin allowlist for MJ Store QA
-- Ensures:
--  - modyelpro60@gmail.com => profiles.role = 'admin'
--  - all other users => 'customer' (default)
begin;

-- Insert allowlist email (idempotent)
insert into public.admin_allowlist (email)
values ('modyelpro60@gmail.com')
on conflict (email) do nothing;

-- Backfill existing profiles whose email matches (case-insensitive)
update public.profiles
set role = 'admin'
where lower(email) = lower('modyelpro60@gmail.com');

commit;
