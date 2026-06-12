import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  requirePermission,
  requireOwner,
} from "../../../lib/auth/requireAuthContext";

const supabaseService = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ── GET /api/admin/roles ──────────────────────────────────────────────────────
// Returns all roles with their permission counts and user counts.
export async function GET(req: Request) {
  try {
    await requirePermission(req, "manage_roles");
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = supabaseService();

    const { data: roles, error } = await supabase
      .from("roles")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Attach permission counts
    const enriched = await Promise.all(
      (roles ?? []).map(async (role: any) => {
        const { count: permCount } = await supabase
          .from("role_permissions")
          .select("*", { count: "exact", head: true })
          .eq("role_id", role.id);

        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role_id", role.id);

        // Also count users by legacy role string for built-in roles
        let legacyUserCount = 0;
        if (role.is_system) {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", role.slug);
          legacyUserCount = Number(count ?? 0);
        }

        return {
          ...role,
          permission_count: Number(permCount ?? 0),
          user_count: Number(userCount ?? 0) + legacyUserCount,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── POST /api/admin/roles ─────────────────────────────────────────────────────
// Creates a new role.
// SECURITY: Owner-only — Admin has manage_roles permission but cannot create roles.
export async function POST(req: Request) {
  let ctx: Awaited<ReturnType<typeof requireOwner>>;
  try {
    ctx = await requireOwner(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Owner access required." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      description?: string;
      color?: string;
      permissions?: string[];
    };

    const name = body.name?.trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, error: "Role name must be at least 2 characters" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

    const supabase = supabaseService();

    // Check unique slug
    const { data: existing } = await supabase
      .from("roles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: false, error: "A role with this name already exists" }, { status: 409 });
    }

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from("roles")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = ((maxOrder as any)?.sort_order ?? 0) + 1;

    const { data: newRole, error: insertError } = await supabase
      .from("roles")
      .insert({
        name,
        slug,
        color: body.color ?? "#6b7280",
        description: body.description?.trim() ?? null,
        is_system: false,
        is_protected: false,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (insertError || !newRole) {
      return NextResponse.json({ success: false, error: insertError?.message ?? "Failed to create role" }, { status: 500 });
    }

    // Assign permissions if provided
    if (body.permissions && body.permissions.length > 0) {
      const perms = body.permissions.map((key) => ({
        role_id: (newRole as any).id,
        permission_key: key,
      }));
      await supabase.from("role_permissions").insert(perms);
    }

    // Audit log
    await supabase.from("permission_audit_logs").insert({
      actor_id: ctx.userId,
      target_type: "role",
      target_id: (newRole as any).id,
      action: "role.create",
      metadata: { name, slug, color: body.color },
    });

    return NextResponse.json({ success: true, data: newRole });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
