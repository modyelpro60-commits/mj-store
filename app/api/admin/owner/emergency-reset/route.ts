import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwner } from "../../../../lib/auth/requireAuthContext";

const supabaseService = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ── POST /api/admin/owner/emergency-reset ─────────────────────────────────────
// SECURITY: Owner-only. Requires explicit confirmation token in body.
// Resets all user roles to 'user' except the calling Owner.
export async function POST(req: Request) {
  let ctx: Awaited<ReturnType<typeof requireOwner>>;
  try {
    ctx = await requireOwner(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Owner access required." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as { confirm?: string };

    if (body.confirm !== "EMERGENCY_RESET_CONFIRMED") {
      return NextResponse.json(
        { success: false, error: "Missing confirmation token." },
        { status: 400 }
      );
    }

    const supabase = supabaseService();

    // Reset all non-owner, non-admin roles to 'user' (staff roles like mod/helper)
    // This preserves admin accounts and the calling owner for safety
    const { error: resetErr } = await supabase
      .from("profiles")
      .update({ role: "user" })
      .in("role", ["helper", "moderator"])
      .neq("id", ctx.userId);

    if (resetErr) {
      return NextResponse.json({ success: false, error: resetErr.message }, { status: 500 });
    }

    // Audit log
    await supabase.from("permission_audit_logs").insert({
      actor_id: ctx.userId,
      target_type: "system",
      target_id: "rbac",
      action: "OWNER_EMERGENCY_RESET",
      metadata: {
        performed_by: ctx.userId,
        scope: "helper+moderator roles reset to user",
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Emergency reset completed. Helper and Moderator roles have been reset to User.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
