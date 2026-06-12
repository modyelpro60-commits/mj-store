import { createClient } from "@supabase/supabase-js";
import {
  type PermissionKey,
  getDefaultPermissions,
} from "../../../lib/rbac/permissions";

export type UserRole = "user" | "helper" | "moderator" | "admin" | "owner";
export type UserStatus = "Active" | "Suspended" | "Banned";

export type AuthContext = {
  userId: string;
  role: UserRole;
  status: UserStatus;
  permissions: PermissionKey[];
};

const ROLE_OPTIONS: UserRole[] = ["user", "helper", "moderator", "admin", "owner"];
const STATUS_OPTIONS: UserStatus[] = ["Active", "Suspended", "Banned"];

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;

  const parts = auth.trim().split(" ");
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return null;

  return token || null;
}

function normalizeRole(value: unknown): UserRole {
  if (typeof value !== "string") return "user";
  const normalized = value.trim().toLowerCase();

  // Legacy values
  if (normalized === "customer") return "user";
  if (normalized === "member") return "user";

  if (ROLE_OPTIONS.includes(normalized as UserRole)) return normalized as UserRole;
  return "user";
}

function normalizeStatus(value: unknown): UserStatus {
  if (typeof value !== "string") return "Active";
  const normalized = value.trim();
  if (STATUS_OPTIONS.includes(normalized as UserStatus)) return normalized as UserStatus;
  return "Active";
}

function forbiddenResponse(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Load a user's effective permissions.
 *
 * Resolution order:
 *   1. If profiles.role_id is set → load from role_permissions JOIN
 *   2. Else → use the default permission set for the legacy role string
 *   3. Owner always has every permission (fast-path, no DB needed)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadPermissions(
  supabase: any,
  userId: string,
  role: UserRole,
  roleId: string | null
): Promise<PermissionKey[]> {
  // Owner: all permissions, no DB query needed
  if (role === "owner") return getDefaultPermissions("owner");

  // If user has a custom role_id, load from DB
  if (roleId) {
    const { data } = await supabase
      .from("role_permissions")
      .select("permission_key")
      .eq("role_id", roleId);

    if (data && data.length > 0) {
      return data.map((r: { permission_key: string }) => r.permission_key as PermissionKey);
    }
  }

  // Fall back to default mapping for legacy role string
  return getDefaultPermissions(role);
}

export async function getAuthContext(req: Request): Promise<AuthContext> {
  const token = getBearerToken(req);

  if (!token) {
    throw forbiddenResponse("Unauthorized");
  }

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);

  if (userError || !userData?.user) {
    throw forbiddenResponse("Unauthorized");
  }

  const userId = userData.user.id;

  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile, error: profileError } = await supabaseService
    .from("profiles")
    .select("id, role, status, role_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw forbiddenResponse("Unauthorized");
  }

  const role = normalizeRole(profile.role);
  const roleId = (profile.role_id as string | null) ?? null;
  const permissions = await loadPermissions(supabaseService, userId, role, roleId);

  return {
    userId,
    role,
    status: normalizeStatus(profile.status),
    permissions,
  };
}

export async function requireActiveUser(req: Request, allowedRoles?: UserRole[]) {
  const ctx = await getAuthContext(req);

  if (ctx.status === "Suspended") throw forbiddenResponse("Account Suspended");
  if (ctx.status === "Banned") throw forbiddenResponse("Account Banned");

  if (allowedRoles) {
    // Owner can access anything that any role can access
    const effective = ctx.role === "owner" ? true : allowedRoles.includes(ctx.role);
    if (!effective) throw forbiddenResponse("Forbidden");
  }

  return ctx;
}

export async function requireRole(
  req: Request,
  allowedRoles: UserRole[]
) {
  return requireActiveUser(req, allowedRoles);
}

/**
 * requireOwner
 * ─────────────
 * Hard gate: only the Owner role passes.
 * Use for any action that must NEVER be reachable by Admin or below —
 * regardless of what permissions Admin holds.
 *
 * @throws Response (403) if the caller is not Owner
 */
export async function requireOwner(req: Request): Promise<AuthContext> {
  const ctx = await getAuthContext(req);

  if (ctx.status === "Suspended") throw new Response(
    JSON.stringify({ error: "Account Suspended" }),
    { status: 403, headers: { "content-type": "application/json" } }
  );
  if (ctx.status === "Banned") throw new Response(
    JSON.stringify({ error: "Account Banned" }),
    { status: 403, headers: { "content-type": "application/json" } }
  );

  if (ctx.role !== "owner") {
    throw new Response(
      JSON.stringify({ error: "Owner access required." }),
      { status: 403, headers: { "content-type": "application/json" } }
    );
  }

  return ctx;
}

/**
 * requirePermission
 * ─────────────────
 * Gates a route on a specific permission key.
 * Owner always passes. Other roles must have the key in their permission set.
 *
 * @throws Response (403) if the user lacks the permission
 */
export async function requirePermission(
  req: Request,
  permission: PermissionKey
): Promise<AuthContext> {
  const ctx = await getAuthContext(req);

  if (ctx.status === "Suspended") throw forbiddenResponse("Account Suspended");
  if (ctx.status === "Banned") throw forbiddenResponse("Account Banned");

  // Owner is always permitted
  if (ctx.role === "owner") return ctx;

  if (!ctx.permissions.includes(permission)) {
    throw forbiddenResponse(`Missing permission: ${permission}`);
  }

  return ctx;
}

/**
 * hasPermission
 * ─────────────
 * Non-throwing helper — checks whether a loaded AuthContext has a permission.
 */
export function hasPermission(ctx: AuthContext, permission: PermissionKey): boolean {
  if (ctx.role === "owner") return true;
  return ctx.permissions.includes(permission);
}
