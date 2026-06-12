import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  requirePermission,
  requireOwner,
} from "../../../../../lib/auth/requireAuthContext";
import {
  PERMISSION_KEYS,
  OWNER_EXCLUSIVE_PERMISSIONS,
} from "../../../../../../lib/rbac/permissions";

const supabaseService = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ── GET /api/admin/roles/[roleId]/permissions ─────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const { roleId } = await params;

  try {
    await requirePermission(req, "manage_roles");
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = supabaseService();

    const { data: permRows } = await supabase
      .from("role_permissions")
      .select("permission_key")
      .eq("role_id", roleId);

    const granted = new Set((permRows ?? []).map((r: any) => r.permission_key as string));

    const { data: allPerms } = await supabase
      .from("permissions")
      .select("*")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    const permissions = (allPerms ?? []).map((p: any) => ({
      ...p,
      granted: granted.has(p.key),
    }));

    return NextResponse.json({ success: true, data: permissions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── PUT /api/admin/roles/[roleId]/permissions ─────────────────────────────────
// SECURITY: Owner-only — changing a role's permission set requires Owner.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const { roleId } = await params;

  let ctx: Awaited<ReturnType<typeof requireOwner>>;
  try {
    ctx = await requireOwner(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Owner access required." }, { status: 403 });
  }

  try {
    const supabase = supabaseService();

    const { data: role, error: roleErr } = await supabase
      .from("roles")
      .select("*")
      .eq("id", roleId)
      .single();

    if (roleErr || !role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    if ((role as any).slug === "owner") {
      return NextResponse.json(
        { success: false, error: "The Owner role has unrestricted access and cannot be edited." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { permissions: string[] };
    const incoming = Array.isArray(body.permissions) ? body.permissions : [];

    const validKeys = new Set<string>(PERMISSION_KEYS);
    const ownerExclusive = new Set<string>(OWNER_EXCLUSIVE_PERMISSIONS);

    // Strip owner-exclusive permissions from any non-owner role.
    // These can NEVER be assigned to any role other than Owner.
    const validated = incoming.filter(
      (k) => validKeys.has(k) && ((role as any).slug === "owner" || !ownerExclusive.has(k))
    );

    const { data: currentRows } = await supabase
      .from("role_permissions")
      .select("permission_key")
      .eq("role_id", roleId);

    const currentSet = new Set((currentRows ?? []).map((r: any) => r.permission_key as string));
    const incomingSet = new Set(validated);

    const granted = validated.filter((k) => !currentSet.has(k));
    const revoked = Array.from(currentSet).filter((k) => !incomingSet.has(k));

    await supabase.from("role_permissions").delete().eq("role_id", roleId);

    if (validated.length > 0) {
      const rows = validated.map((key) => ({ role_id: roleId, permission_key: key }));
      const { error: insertErr } = await supabase.from("role_permissions").insert(rows);
      if (insertErr) {
        return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
      }
    }

    if (granted.length > 0 || revoked.length > 0) {
      await supabase.from("permission_audit_logs").insert({
        actor_id: ctx.userId,
        target_type: "role",
        target_id: roleId,
        action: "permission.update",
        metadata: {
          role_name: (role as any).name,
          granted,
          revoked,
          total: validated.length,
        },
      });
    }

    return NextResponse.json({ success: true, data: { granted, revoked } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── PATCH /api/admin/roles/[roleId]/permissions ───────────────────────────────
// SECURITY: Owner-only — toggling individual permissions requires Owner.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const { roleId } = await params;

  let ctx: Awaited<ReturnType<typeof requireOwner>>;
  try {
    ctx = await requireOwner(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Owner access required." }, { status: 403 });
  }

  try {
    const supabase = supabaseService();

    const { data: role, error: roleErr } = await supabase
      .from("roles")
      .select("*")
      .eq("id", roleId)
      .single();

    if (roleErr || !role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    if ((role as any).slug === "owner") {
      return NextResponse.json(
        { success: false, error: "The Owner role cannot be edited." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { permission: string; granted: boolean };
    const { permission, granted } = body;

    if (!permission || !PERMISSION_KEYS.includes(permission as any)) {
      return NextResponse.json({ success: false, error: "Invalid permission key" }, { status: 400 });
    }

    // Prevent assigning owner-exclusive permissions to non-owner roles
    const ownerExcl = new Set<string>(OWNER_EXCLUSIVE_PERMISSIONS);
    if (ownerExcl.has(permission) && (role as any).slug !== "owner") {
      return NextResponse.json(
        { success: false, error: "That permission is Owner-exclusive and cannot be assigned to other roles." },
        { status: 403 }
      );
    }

    if (granted) {
      await supabase
        .from("role_permissions")
        .upsert({ role_id: roleId, permission_key: permission }, { onConflict: "role_id,permission_key" });
    } else {
      await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId)
        .eq("permission_key", permission);
    }

    await supabase.from("permission_audit_logs").insert({
      actor_id: ctx.userId,
      target_type: "role",
      target_id: roleId,
      action: granted ? "permission.grant" : "permission.revoke",
      metadata: { role_name: (role as any).name, permission },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
