"use client";

import { useAuth } from "../../components/auth/AuthProvider";
import type { PermissionKey } from "./permissions";

/**
 * usePermission
 * ─────────────
 * Returns `true` if the current user has the given permission.
 *
 * @example
 *   const canConfirm = usePermission("confirm_payment");
 *   if (!canConfirm) return <p>Access denied</p>;
 */
export function usePermission(permission: PermissionKey): boolean {
  const { can } = useAuth();
  return can(permission);
}

/**
 * usePermissions
 * ──────────────
 * Returns an object mapping each requested permission to a boolean.
 *
 * @example
 *   const { confirm_payment, cancel_order } = usePermissions(["confirm_payment", "cancel_order"]);
 */
export function usePermissions<K extends PermissionKey>(
  keys: K[]
): Record<K, boolean> {
  const { can } = useAuth();
  return Object.fromEntries(keys.map((k) => [k, can(k)])) as Record<K, boolean>;
}
