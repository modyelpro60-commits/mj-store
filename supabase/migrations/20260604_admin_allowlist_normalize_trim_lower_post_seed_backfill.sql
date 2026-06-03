-- Post-seed backfill to ensure existing users are promoted using case-insensitive + trim matching.
-- This runs after the allowlist seed migration so the allowlist row exists before we backfill.

begin;

-- Promote to admin when profile email matches allowlist email (case-insensitive + trim).
-- Only promotes; does not demote any other role.
update public.profiles p
set role = 'admin'
from public.admin_allowlist a
where p.email is not null
  and lower(trim(p.email)) = lower(trim(a.email))
  and p.role is distinct from 'admin';

commit;
