import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwner } from "../../../../lib/auth/requireAuthContext";

const supabaseService = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export type OwnerStatsData = {
  totalRoles: number;
  totalPermissions: number;
  totalAuditEvents: number;
  recentAuditEvents: AuditEvent[];
  ownerUserCount: number;
  adminUserCount: number;
  lastOwnerAssignment: string | null;
  lastPermissionChange: string | null;
  lastSecurityEvent: string | null;
  permissionCoverage: number; // % of roles that have at least 1 permission
  protectedResources: number;
  systemRolesCount: number;
};

type AuditEvent = {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

// ── GET /api/admin/owner/stats ────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    await requireOwner(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Owner access required." }, { status: 403 });
  }

  try {
    const supabase = supabaseService();

    const [
      rolesRes,
      permsRes,
      auditCountRes,
      recentAuditRes,
      ownerCountRes,
      adminCountRes,
      lastOwnerAssignRes,
      lastPermChangeRes,
    ] = await Promise.all([
      // Total roles
      supabase.from("roles").select("*", { count: "exact", head: false }),
      // Total permissions
      supabase.from("permissions").select("*", { count: "exact", head: false }),
      // Total audit events
      supabase.from("permission_audit_logs").select("*", { count: "exact", head: true }),
      // Recent audit events (last 10)
      supabase
        .from("permission_audit_logs")
        .select("id, actor_id, action, target_type, target_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      // Owner user count
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "owner"),
      // Admin user count
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin"),
      // Last owner assignment
      supabase
        .from("permission_audit_logs")
        .select("created_at, metadata")
        .or("action.eq.user.role_assigned,action.eq.OWNER_ASSIGNED")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Last permission change
      supabase
        .from("permission_audit_logs")
        .select("created_at")
        .or("action.eq.permission.update,action.eq.permission.grant,action.eq.permission.revoke,action.eq.ROLE_PERMISSION_CHANGED")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const roles = rolesRes.data ?? [];
    const permissions = permsRes.data ?? [];
    const totalRoles = roles.length;
    const totalPermissions = permissions.length;
    const totalAuditEvents = Number(auditCountRes.count ?? 0);

    // Compute permission coverage: % of roles with ≥1 permission
    let coveredRoles = 0;
    for (const role of roles as Array<{ id: string; slug: string }>) {
      const { count } = await supabase
        .from("role_permissions")
        .select("*", { count: "exact", head: true })
        .eq("role_id", role.id);
      if (Number(count ?? 0) > 0) coveredRoles++;
    }
    const permissionCoverage =
      totalRoles > 0 ? Math.round((coveredRoles / totalRoles) * 100) : 0;

    const protectedResources = (roles as Array<{ is_protected: boolean }>).filter((r) => r.is_protected).length;
    const systemRolesCount = (roles as Array<{ is_system: boolean }>).filter((r) => r.is_system).length;

    const stats: OwnerStatsData = {
      totalRoles,
      totalPermissions,
      totalAuditEvents,
      recentAuditEvents: (recentAuditRes.data ?? []) as AuditEvent[],
      ownerUserCount: Number(ownerCountRes.count ?? 0),
      adminUserCount: Number(adminCountRes.count ?? 0),
      lastOwnerAssignment: (lastOwnerAssignRes.data as any)?.created_at ?? null,
      lastPermissionChange: (lastPermChangeRes.data as any)?.created_at ?? null,
      lastSecurityEvent: (recentAuditRes.data?.[0] as any)?.created_at ?? null,
      permissionCoverage,
      protectedResources,
      systemRolesCount,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
