-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  RBAC System  –  Roles, Permissions, Role-Permissions                  ║
-- ║  Migration 20260629_rbac_system                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── 1. ROLES TABLE ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.roles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        UNIQUE NOT NULL,
  slug         TEXT        UNIQUE NOT NULL,
  color        TEXT        NOT NULL DEFAULT '#6b7280',
  description  TEXT,
  is_system    BOOLEAN     NOT NULL DEFAULT false,
  is_protected BOOLEAN     NOT NULL DEFAULT false,  -- cannot be deleted
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. PERMISSIONS TABLE ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.permissions (
  key         TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ─── 3. ROLE_PERMISSIONS JUNCTION ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id        UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key)
);

-- ─── 4. ADD role_id TO PROFILES (nullable – backward-compat) ─────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- ─── 5. AUDIT LOG TABLE ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.permission_audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID        NOT NULL,
  target_type  TEXT        NOT NULL,  -- 'role' | 'user'
  target_id    TEXT        NOT NULL,
  action       TEXT        NOT NULL,  -- 'role.create' | 'role.update' | 'role.delete' | 'permission.grant' | 'permission.revoke' | 'user.role_assigned'
  metadata     JSONB       DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 6. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE public.roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read roles and permissions (needed for client-side hooks)
-- Use DROP IF EXISTS so this file is safe to re-run.
DROP POLICY IF EXISTS "authenticated_read_roles"           ON public.roles;
DROP POLICY IF EXISTS "authenticated_read_permissions"     ON public.permissions;
DROP POLICY IF EXISTS "authenticated_read_role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "service_read_audit"                 ON public.permission_audit_logs;

CREATE POLICY "authenticated_read_roles"
  ON public.roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_permissions"
  ON public.permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_role_permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- Audit logs: service role only
CREATE POLICY "service_read_audit"
  ON public.permission_audit_logs FOR SELECT USING (true);

-- ─── 7. UPDATED_AT TRIGGER ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 8. SEED: PERMISSIONS ────────────────────────────────────────────────────

INSERT INTO public.permissions (key, name, description, category, sort_order) VALUES
  -- Products
  ('view_products',            'View Products',           'Browse and search all products',                 'Products',  10),
  ('create_products',          'Create Products',         'Add new products to the store',                  'Products',  20),
  ('edit_products',            'Edit Products',           'Modify existing product information',            'Products',  30),
  ('delete_products',          'Delete Products',         'Permanently remove products',                    'Products',  40),

  -- Orders
  ('view_orders',              'View Orders',             'See all customer orders',                        'Orders',    10),
  ('confirm_payment',          'Confirm Payment',         'Approve customer payment screenshots',           'Orders',    20),
  ('reject_payment',           'Reject Payment',          'Reject payment proof and notify customer',       'Orders',    30),
  ('deliver_order',            'Deliver Order',           'Mark an order as delivered / completed',         'Orders',    40),
  ('cancel_order',             'Cancel Order',            'Cancel a pending or processing order',           'Orders',    50),
  ('delete_order',             'Delete Order',            'Permanently delete an order record',             'Orders',    60),
  ('update_order_status',      'Update Order Status',     'Manually change any order status field',         'Orders',    70),

  -- Chat
  ('view_chat',                'View Chats',              'Access all support conversations',               'Chat',      10),
  ('send_messages',            'Send Messages',           'Reply to customers in chat',                     'Chat',      20),
  ('close_chat',               'Close Chats',             'Resolve and close conversations',                'Chat',      30),
  ('delete_chat',              'Delete Chats',            'Permanently delete a conversation',              'Chat',      40),
  ('view_attachments',         'View Attachments',        'See uploaded payment screenshots',               'Chat',      50),

  -- Users
  ('view_users',               'View Users',              'Browse user accounts and details',               'Users',     10),
  ('edit_users',               'Edit Users',              'Modify user profile information',                'Users',     20),
  ('ban_users',                'Ban / Suspend Users',     'Restrict user account access',                   'Users',     30),
  ('delete_users',             'Delete Users',            'Permanently remove user accounts',               'Users',     40),
  ('change_user_roles',        'Change User Roles',       'Assign different roles to users',                'Users',     50),
  ('verify_users',             'Verify Users',            'Grant verified badge to users',                  'Users',     60),

  -- Payments
  ('view_payment_methods',     'View Payment Methods',    'See configured payment accounts',                'Payments',  10),
  ('add_payment_accounts',     'Add Payment Accounts',    'Create new payment receive accounts',            'Payments',  20),
  ('edit_payment_accounts',    'Edit Payment Accounts',   'Modify payment account details',                 'Payments',  30),
  ('delete_payment_accounts',  'Delete Payment Accounts', 'Remove payment receive accounts',                'Payments',  40),

  -- Analytics
  ('view_analytics',           'View Analytics',          'Access analytics dashboards',                    'Analytics', 10),
  ('view_dashboard',           'View Dashboard',          'Access admin overview dashboard',                'Analytics', 20),
  ('export_reports',           'Export Reports',          'Download reports and data exports',              'Analytics', 30),

  -- System
  ('view_logs',                'View Logs',               'Access activity and audit logs',                 'System',    10),
  ('manage_roles',             'Manage Roles',            'Create, edit, and delete roles',                 'System',    20),
  ('manage_permissions',       'Manage Permissions',      'Configure role permission sets',                 'System',    30),
  ('manage_settings',          'Manage Settings',         'Access and modify site settings',                'System',    40)

ON CONFLICT (key) DO NOTHING;

-- ─── 9. SEED: ROLES ──────────────────────────────────────────────────────────

INSERT INTO public.roles (name, slug, color, description, is_system, is_protected, sort_order) VALUES
  ('Owner',     'owner',     '#f59e0b', 'Full unrestricted access. This role cannot be modified or deleted.', true, true,  0),
  ('Admin',     'admin',     '#a855f7', 'Full platform access. Can manage all features and settings.',        true, false, 1),
  ('Moderator', 'moderator', '#3b82f6', 'Manages orders, chat, and customer support workflows.',              true, false, 2),
  ('Helper',    'helper',    '#10b981', 'Assists customers with basic support tasks.',                        true, false, 3),
  ('User',      'user',      '#6b7280', 'Standard customer account with no admin capabilities.',              true, false, 4)
ON CONFLICT (slug) DO NOTHING;

-- ─── 10. SEED: ROLE PERMISSIONS ──────────────────────────────────────────────

-- Owner gets ALL permissions
INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT r.id, p.key
  FROM   public.roles r
  CROSS  JOIN public.permissions p
  WHERE  r.slug = 'owner'
ON CONFLICT DO NOTHING;

-- Admin gets ALL permissions
INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT r.id, p.key
  FROM   public.roles r
  CROSS  JOIN public.permissions p
  WHERE  r.slug = 'admin'
ON CONFLICT DO NOTHING;

-- Moderator permissions
INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT r.id, p.key
  FROM   public.roles r
  JOIN   public.permissions p ON p.key IN (
    'view_products',
    'view_orders', 'confirm_payment', 'reject_payment', 'deliver_order',
    'cancel_order', 'update_order_status',
    'view_chat', 'send_messages', 'close_chat', 'view_attachments',
    'view_users',
    'view_payment_methods',
    'view_analytics', 'view_dashboard',
    'view_logs'
  )
  WHERE r.slug = 'moderator'
ON CONFLICT DO NOTHING;

-- Helper permissions
INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT r.id, p.key
  FROM   public.roles r
  JOIN   public.permissions p ON p.key IN (
    'view_products',
    'view_orders',
    'view_chat', 'send_messages', 'view_attachments',
    'view_users',
    'view_dashboard'
  )
  WHERE r.slug = 'helper'
ON CONFLICT DO NOTHING;

-- User: no permissions (customers)
