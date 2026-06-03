# USERS_DB_FIX_REPORT.md — Admin Users DB Integration Fix

## 1) Root Cause (verified on live DB)
The admin Users system expects these columns in `public.profiles`:
- `role`
- `status`

Verification (live DB):
- **`profiles.status` does NOT exist**  
  - Error observed when querying: `column profiles.status does not exist` (Postgres code `42703`).
- Existing roles currently stored:
  - `customer`: 3 users
  - `admin`: 1 user

So the UI/API was failing because `public.profiles.status` is missing in the live database schema.

## 2) Live DB findings: `public.profiles` schema status
Confirmed missing:
- `public.profiles.status` ✅ **missing**

Confirmed existing:
- `public.profiles.role` ✅ exists
- Current role values are legacy (`customer` instead of `user`)

## 3) Required DB columns & defaults (per spec)
### Required columns
- `role`
- `status`

### Required defaults
- `role = 'user'`
- `status = 'active'`

## 4) Fix: Migration SQL added to repo
Added a DB fix migration that should bring the live schema in line with the Users Management spec and required backfills:

### Migration file
- **`mj-store/supabase/migrations/20260612_users_db_fix.sql`**

### What it does
1. Adds `public.profiles.status` (if missing)
   - `NOT NULL DEFAULT 'Active'`
   - CHECK: `('Active','Suspended','Banned')`
2. Sets `public.profiles.role` default to `'user'`
3. Backfills roles:
   - `modyelpro60@gmail.com` => `admin`
   - all other users => `user`
4. Backfills status:
   - sets any `NULL` status to `'Active'`
5. Replaces `public.handle_new_user_profile()` trigger so new signups get:
   - `'admin'` if allowlisted, otherwise `'user'`

## 5) Queries update (no UI changes)
To fully rely on the DB schema fix, the Users API was updated to assume `profiles.status` exists (so the DB fix must be applied first).

- Updated file:
  - `mj-store/app/api/admin/users/route.ts`

## 6) How to apply migration (external DB tooling needed)
This environment does not have working `supabase` CLI or `psql` available to apply migrations directly from here.

Apply the following SQL to your Supabase Postgres DB using your normal migration runner or SQL editor:
- `mj-store/supabase/migrations/20260612_users_db_fix.sql`

## 7) Verification checklist (after migration succeeds)
After applying the migration, verify:

1. `public.profiles.status` exists
2. Roles backfilled correctly:
   - `modyelpro60@gmail.com` => `admin`
   - all others => `user`
3. Status defaults:
   - all users => `Active`
4. Users list loads successfully:
   - `/admin/users` loads
   - Search works
   - Role filter works
   - Status filter works
   - Dashboard counters work

## 8) Build status
- ✅ `npm --prefix mj-store run build` was run successfully in the repo after the Users Management code changes.
