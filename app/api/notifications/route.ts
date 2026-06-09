import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContext } from "../../lib/auth/requireAuthContext";

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/notifications
// Returns last 30 notifications for the authenticated user + unread count
export async function GET(req: Request) {
  let ctx;
  try {
    ctx = await getAuthContext(req);
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await svc
    .from("notifications")
    .select("id, type, title, message, link, is_read, created_at")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const list = data ?? [];
  const unreadCount = list.filter((n) => !n.is_read).length;

  return NextResponse.json({ success: true, data: list, unreadCount });
}
