-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Fix: Add 'owner' to profiles_role_check + Assign Owner Account        ║
-- ║  Migration 20260631_fix_role_constraint_and_assign_owner               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Run this in the Supabase SQL Editor AFTER 20260629 and 20260630.
-- Safe to run multiple times (idempotent).

-- ─── 1. Drop the old role check constraint (blocks 'owner') ──────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    RAISE NOTICE 'Dropped old profiles_role_check constraint.';
  ELSE
    RAISE NOTICE 'profiles_role_check does not exist — skipping drop.';
  END IF;
END $$;

-- ─── 2. Recreate the constraint with 'owner' included ────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('user', 'helper', 'moderator', 'admin', 'owner'));
    RAISE NOTICE 'Created new profiles_role_check with owner included.';
  ELSE
    RAISE NOTICE 'profiles_role_check already exists — skipping creation.';
  END IF;
END $$;

-- ─── 3. Assign modyelpro60@gmail.com as Owner ────────────────────────────────

UPDATE public.profiles
SET    role = 'owner'
WHERE  email = 'modyelpro60@gmail.com'
  AND  role != 'owner';  -- skip if already owner

-- ─── 4. Log the assignment (safe — ignores if no matching profile found) ─────

INSERT INTO public.permission_audit_logs (actor_id, target_type, target_id, action, metadata)
SELECT
  id,
  'user',
  id::text,
  'user.role_assigned',
  jsonb_build_object(
    'role',       'owner',
    'source',     'migration_20260631',
    'email',      'modyelpro60@gmail.com',
    'applied_at', now()
  )
FROM public.profiles
WHERE email = 'modyelpro60@gmail.com'
ON CONFLICT DO NOTHING;

-- ─── 5. Verify ───────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_role TEXT;
  v_name TEXT;
BEGIN
  SELECT role, full_name
  INTO   v_role, v_name
  FROM   public.profiles
  WHERE  email = 'modyelpro60@gmail.com'
  LIMIT  1;

  IF v_role = 'owner' THEN
    RAISE NOTICE 'SUCCESS: % is now Owner.', COALESCE(v_name, 'modyelpro60@gmail.com');
  ELSIF v_role IS NULL THEN
    RAISE WARNING 'Profile not found for modyelpro60@gmail.com — check the email.';
  ELSE
    RAISE WARNING 'Unexpected role "%" for modyelpro60@gmail.com.', v_role;
  END IF;
END $$;
