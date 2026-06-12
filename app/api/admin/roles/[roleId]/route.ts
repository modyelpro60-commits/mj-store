import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  requirePermission,
  requireOwner,
} from "../../../../lib/auth/requireAuthContext";

const supabaseService = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ── GET /api/admin/roles/[roleId] ─────────────────────────────────────────────
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

    const { data: role, error } = await supabase
      .from("roles")
      .select("*")
      .eq("id", roleId)
      .single();

    if (error || !role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    const { data: permRows } = await supabase
      .from("role_permissions")
      .select("permission_key")
      .eq("role_id", roleId);

    const permissions = (permRows ?? []).map((r: any) => r.permission_key as string);

    return NextResponse.json({ success: true, data: { ...role, permissions } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── PATCH /api/admin/roles/[roleId] ──────────────────────────────────────────
// SECURITY: Owner-only — editing roles (even non-owner system roles) requires Owner.
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

    const { data: existing, error: fetchErr } = await supabase
      .from("roles")
      .select("*")
      .eq("id", roleId)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    // Owner role is fully protected — no modifications allowed
    if ((existing as any).slug === "owner") {
      return NextResponse.json(
        { success: false, error: "The Owner role cannot be modified." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      name?: string;
      description?: string;
      color?: string;
    };

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (trimmed.length < 2) {
        return NextResponse.json({ success: false, error: "Name must be at least 2 characters" }, { status: 400 });
      }
      updates.name = trimmed;
    }
    if (body.description !== undefined) updates.description = body.description.trim() || null;
    if (body.color !== undefined) updates.color = body.color;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    const { data: updated, error: updateErr } = await supabase
      .from("roles")
      .update(updates)
      .eq("id", roleId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // Audit log
    await supabase.from("permission_audit_logs").insert({
      actor_id: ctx.userId,
      target_type: "role",
      target_id: roleId,
      action: "role.update",
      metadata: updates,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── DELETE /api/admin/roles/[roleId] ─────────────────────────────────────────
// SECURITY: Owner-only — deleting roles requires Owner.
export async function DELETE(
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

    const { data: existing, error: fetchErr } = await supabase
      .from("roles")
      .select("*")
      .eq("id", roleId)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    if ((existing as any).is_protected) {
      return NextResponse.json(
        { success: false, error: "System roles cannot be deleted." },
        { status: 403 }
      );
    }

    // Check if any users have this role assigned
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role_id", roleId);

    if (Number(userCount ?? 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role with ${userCount} assigned user(s). Reassign them first.`,
        },
        { status: 409 }
      );
    }

    // Cascade deletes role_permissions via FK
    const { error: deleteErr } = await supabase
      .from("roles")
      .delete()
      .eq("id", roleId);

    if (deleteErr) {
      return NextResponse.json({ success: false, error: deleteErr.message }, { status: 500 });
    }

    // Audit log
    await supabase.from("permission_audit_logs").insert({
      actor_id: ctx.userId,
      target_type: "role",
      target_id: roleId,
      action: "role.delete",
      metadata: { name: (existing as any).name, slug: (existing as any).slug },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
