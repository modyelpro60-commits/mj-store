import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../../lib/auth/requireAuthContext";

const STAFF_ROLES: UserRole[] = ["admin", "moderator", "helper"];

/* ─── GET /api/admin/logs ────────────────────────────────────────────────────
 * Returns the latest activity-log entries. Staff only.
 * ─────────────────────────────────────────────────────────────────────────── */
export async function GET(req: Request) {
  try {
    await requireRole(req, STAFF_ROLES);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, action, actor_name, actor_role, target_type, target_id, target_label, created_at")
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const logs = (data ?? []).map((l: any) => ({
    id:          l.id,
    action:      l.action,
    actorName:   l.actor_name ?? "غير معروف",
    actorRole:   l.actor_role ?? null,
    targetType:  l.target_type ?? null,
    targetId:    l.target_id ?? null,
    targetLabel: l.target_label ?? null,
    createdAt:   l.created_at,
  }));

  return NextResponse.json({ success: true, data: logs });
}
