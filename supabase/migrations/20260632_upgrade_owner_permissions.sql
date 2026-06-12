-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Upgrade Owner-Exclusive Permissions                                   ║
-- ║  Migration 20260632_upgrade_owner_permissions                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Safe to re-run (idempotent via ON CONFLICT DO NOTHING / IF EXISTS).
-- Run AFTER migrations 20260629, 20260630, 20260631.

-- ─── 1. Remove OLD owner-exclusive permissions (replaced by cleaner names) ──

DELETE FROM public.role_permissions
WHERE permission_key IN (
  'emergency_access',
  'system_recovery',
  'protected_role_management',
  'owner_controls'
);

DELETE FROM public.permissions
WHERE key IN (
  'emergency_access',
  'system_recovery',
  'protected_role_management',
  'owner_controls'
);

-- ─── 2. Add NEW owner-exclusive permission keys ──────────────────────────────

INSERT INTO public.permissions (key, name, description, category, sort_order) VALUES
  ('revoke_owner',          'Revoke Owner Role',           'Remove the Owner role from a user — only an Owner can do this',               'System', 55),
  ('override_permissions',  'Override Permissions',        'Bypass the normal permission model and grant arbitrary access',                'System', 60),
  ('emergency_reset_rbac',  'Emergency RBAC Reset',        'Force-reset all role assignments and permission tables to factory defaults',   'System', 70),
  ('view_security_audit',   'View Security Audit',         'Access the RBAC security audit log with full event history',                  'System', 80),
  ('manage_system_roles',   'Manage System Roles',         'Create, edit, delete, and restructure system-level roles',                    'System', 90)
ON CONFLICT (key) DO NOTHING;

-- assign_owner already exists from 20260630 — no-op via ON CONFLICT
INSERT INTO public.permissions (key, name, description, category, sort_order) VALUES
  ('assign_owner', 'Assign Owner Role', 'Grant the Owner role to a user — only an Owner can do this', 'System', 50)
ON CONFLICT (key) DO NOTHING;

-- ─── 3. Grant ALL 6 owner-exclusive permissions to Owner role ────────────────

INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT r.id, p.key
  FROM   public.roles r
  CROSS  JOIN public.permissions p
  WHERE  r.slug = 'owner'
    AND  p.key IN (
      'assign_owner',
      'revoke_owner',
      'override_permissions',
      'emergency_reset_rbac',
      'view_security_audit',
      'manage_system_roles'
    )
ON CONFLICT DO NOTHING;

-- ─── 4. Ensure Admin does NOT have any owner-exclusive permissions ────────────

DELETE FROM public.role_permissions rp
USING public.roles r
WHERE rp.role_id = r.id
  AND r.slug != 'owner'
  AND rp.permission_key IN (
    'assign_owner',
    'revoke_owner',
    'override_permissions',
    'emergency_reset_rbac',
    'view_security_audit',
    'manage_system_roles'
  );

-- ─── 5. Add new audit event types to a reference comment ─────────────────────
-- These action strings are used in permission_audit_logs.action column:
--   OWNER_ASSIGNED           — owner role assigned
--   OWNER_REVOKED            — owner role revoked
--   OWNER_OVERRIDE           — override_permissions invoked
--   OWNER_EMERGENCY_RESET    — emergency_reset_rbac invoked
--   ROLE_PERMISSION_CHANGED  — role permission set changed
--   ROLE_CREATED             — new role created
--   ROLE_DELETED             — role deleted

-- ─── 6. Verify ───────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_owner_count INT;
  v_admin_excl  INT;
BEGIN
  -- Count owner-exclusive permissions granted to Owner
  SELECT COUNT(*) INTO v_owner_count
  FROM   public.role_permissions rp
  JOIN   public.roles r ON r.id = rp.role_id
  WHERE  r.slug = 'owner'
    AND  rp.permission_key IN (
      'assign_owner','revoke_owner','override_permissions',
      'emergency_reset_rbac','view_security_audit','manage_system_roles'
    );

  -- Count owner-exclusive permissions (wrongly) held by admin
  SELECT COUNT(*) INTO v_admin_excl
  FROM   public.role_permissions rp
  JOIN   public.roles r ON r.id = rp.role_id
  WHERE  r.slug = 'admin'
    AND  rp.permission_key IN (
      'assign_owner','revoke_owner','override_permissions',
      'emergency_reset_rbac','view_security_audit','manage_system_roles'
    );

  IF v_owner_count = 6 THEN
    RAISE NOTICE 'SUCCESS: Owner has all 6 exclusive permissions.';
  ELSE
    RAISE WARNING 'Expected 6 owner-exclusive permissions, found: %', v_owner_count;
  END IF;

  IF v_admin_excl = 0 THEN
    RAISE NOTICE 'SUCCESS: Admin has 0 owner-exclusive permissions.';
  ELSE
    RAISE WARNING 'Admin still has % owner-exclusive permission(s)!', v_admin_excl;
  END IF;
END $$;
