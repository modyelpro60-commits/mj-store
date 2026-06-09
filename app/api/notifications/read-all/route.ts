import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContext } from "../../../lib/auth/requireAuthContext";

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/notifications/read-all
// Marks all unread notifications as read for the authenticated user
export async function PATCH(req: Request) {
  let ctx;
  try {
    ctx = await getAuthContext(req);
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await svc
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", ctx.userId)
    .eq("is_read", false);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
