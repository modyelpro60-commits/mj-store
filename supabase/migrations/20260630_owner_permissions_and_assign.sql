-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Owner-Exclusive Permissions + Initial Owner Assignment               ║
-- ║  Migration 20260630_owner_permissions_and_assign                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── 1. Add Owner-exclusive permission keys ───────────────────────────────────
-- These permissions are ONLY granted to Owner. Admin cannot perform these actions.

INSERT INTO public.permissions (key, name, description, category, sort_order) VALUES
  ('assign_owner',               'Assign Owner Role',            'Grant or revoke the Owner role — only an Owner can do this',           'System', 50),
  ('emergency_access',           'Emergency Access',             'Bypass all locks and access restrictions in an emergency',             'System', 60),
  ('system_recovery',            'System Recovery',              'Trigger emergency system recovery procedures',                         'System', 70),
  ('protected_role_management',  'Protected Role Management',    'Edit, rename, or restructure system and protected roles',              'System', 80),
  ('owner_controls',             'Owner Controls Panel',         'Access the Owner-only system controls and emergency dashboard',        'System', 90)
ON CONFLICT (key) DO NOTHING;

-- ─── 2. Grant these 5 permissions ONLY to Owner ───────────────────────────────
-- Admin intentionally does NOT receive these.

INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT r.id, p.key
  FROM   public.roles r
  CROSS  JOIN public.permissions p
  WHERE  r.slug = 'owner'
    AND  p.key IN (
      'assign_owner',
      'emergency_access',
      'system_recovery',
      'protected_role_management',
      'owner_controls'
    )
ON CONFLICT DO NOTHING;

-- ─── 3. Ensure Owner role has ALL other permissions (idempotent) ──────────────

INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT r.id, p.key
  FROM   public.roles r
  CROSS  JOIN public.permissions p
  WHERE  r.slug = 'owner'
ON CONFLICT DO NOTHING;

-- ─── 4. Assign modyelpro60@gmail.com as Owner ────────────────────────────────
-- NOTE: This step requires profiles_role_check to allow 'owner'.
-- If this fails with a constraint violation, run 20260631 instead.

DO $$
BEGIN
  -- Only attempt if the constraint already allows 'owner'
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
      AND pg_get_constraintdef(oid) LIKE '%owner%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    UPDATE public.profiles
    SET    role = 'owner'
    WHERE  email = 'modyelpro60@gmail.com';

    RAISE NOTICE 'Owner role assigned to modyelpro60@gmail.com.';
  ELSE
    RAISE NOTICE 'Skipping owner assignment — run migration 20260631 first to fix the role constraint.';
  END IF;
END $$;
