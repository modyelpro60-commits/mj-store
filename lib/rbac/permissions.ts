/**
 * lib/rbac/permissions.ts
 * ────────────────────────
 * Central registry of all permission keys, their categories, and the
 * default permission sets for each legacy role string.
 *
 * IMPORTANT: This file is imported in BOTH server and client contexts.
 * Keep it dependency-free (no supabase, no next/server, etc.).
 */

// ─── Permission Keys ─────────────────────────────────────────────────────────

export const PERMISSION_KEYS = [
  // Products
  "view_products",
  "create_products",
  "edit_products",
  "delete_products",

  // Orders
  "view_orders",
  "confirm_payment",
  "reject_payment",
  "deliver_order",
  "cancel_order",
  "delete_order",
  "update_order_status",

  // Chat
  "view_chat",
  "send_messages",
  "close_chat",
  "delete_chat",
  "view_attachments",

  // Users
  "view_users",
  "edit_users",
  "ban_users",
  "delete_users",
  "change_user_roles",
  "verify_users",

  // Payments
  "view_payment_methods",
  "add_payment_accounts",
  "edit_payment_accounts",
  "delete_payment_accounts",

  // Analytics
  "view_analytics",
  "view_dashboard",
  "export_reports",

  // System — shared
  "view_logs",
  "manage_roles",
  "manage_permissions",
  "manage_settings",

  // System — Owner-EXCLUSIVE (Admin does NOT have these)
  "assign_owner",
  "revoke_owner",
  "override_permissions",
  "emergency_reset_rbac",
  "view_security_audit",
  "manage_system_roles",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/**
 * Keys that are exclusive to the Owner role — no other role can hold them.
 * Admin explicitly cannot have these, no matter what.
 */
export const OWNER_EXCLUSIVE_PERMISSIONS: readonly PermissionKey[] = [
  "assign_owner",
  "revoke_owner",
  "override_permissions",
  "emergency_reset_rbac",
  "view_security_audit",
  "manage_system_roles",
] as const;

// ─── Default permissions per legacy role ─────────────────────────────────────
// Used as a fallback when profiles.role_id is NULL (i.e., all existing users).
// When role_id IS set, permissions come from the DB role_permissions table instead.

const OWNER_PERMISSIONS = new Set<PermissionKey>(PERMISSION_KEYS);

// Admin gets all EXCEPT the owner-exclusive keys
const ADMIN_PERMISSIONS = new Set<PermissionKey>(
  PERMISSION_KEYS.filter(
    (k) => !(OWNER_EXCLUSIVE_PERMISSIONS as readonly string[]).includes(k)
  )
);

const MODERATOR_PERMISSIONS = new Set<PermissionKey>([
  "view_products",
  "view_orders", "confirm_payment", "reject_payment", "deliver_order",
  "cancel_order", "update_order_status",
  "view_chat", "send_messages", "close_chat", "view_attachments",
  "view_users",
  "view_payment_methods",
  "view_analytics", "view_dashboard",
  "view_logs",
]);

const HELPER_PERMISSIONS = new Set<PermissionKey>([
  "view_products",
  "view_orders",
  "view_chat", "send_messages", "view_attachments",
  "view_users",
  "view_dashboard",
]);

const USER_PERMISSIONS = new Set<PermissionKey>([]);

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Set<PermissionKey>> = {
  owner:     OWNER_PERMISSIONS,
  admin:     ADMIN_PERMISSIONS,
  moderator: MODERATOR_PERMISSIONS,
  helper:    HELPER_PERMISSIONS,
  user:      USER_PERMISSIONS,
  customer:  USER_PERMISSIONS, // legacy alias
};

/**
 * Returns the default permissions for a legacy role string.
 * Safe to call on both server and client.
 */
export function getDefaultPermissions(role: string | null): PermissionKey[] {
  if (!role) return [];
  const set = DEFAULT_ROLE_PERMISSIONS[role.toLowerCase()];
  return set ? Array.from(set) : [];
}

/**
 * Checks a permission against a set using ONLY the default role mapping.
 * Use this in client-side code where DB access isn't available.
 */
export function defaultRoleHasPermission(role: string | null, permission: PermissionKey): boolean {
  // Owner is always granted everything, regardless of DB state.
  if (role === "owner") return true;
  const set = DEFAULT_ROLE_PERMISSIONS[role?.toLowerCase() ?? ""] ?? new Set();
  return set.has(permission);
}
