"use client";

import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import type { PermissionKey } from "../../lib/rbac/permissions";

interface CanProps {
  /** The permission key to check */
  permission: PermissionKey;
  /** Content to render when the user HAS the permission */
  children: ReactNode;
  /** Optional content to render when the user LACKS the permission */
  fallback?: ReactNode;
}

/**
 * <Can>
 * ─────
 * Renders `children` only when the current user has the given permission.
 * Renders `fallback` (default: nothing) otherwise.
 *
 * Owner always passes every permission check.
 *
 * @example
 *   <Can permission="delete_order">
 *     <DeleteButton />
 *   </Can>
 *
 *   <Can permission="manage_roles" fallback={<p>No access</p>}>
 *     <RolesPage />
 *   </Can>
 */
export default function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
