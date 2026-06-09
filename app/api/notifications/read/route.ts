import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContext } from "../../../lib/auth/requireAuthContext";

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/notifications/read
// Marks a single notification as read (must belong to the caller)
export async function PATCH(req: Request) {
  let ctx;
  try {
    ctx = await getAuthContext(req);
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { id?: unknown };
  const id = body.id;

  if (id === undefined || id === null) {
    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  }

  const { error } = await svc
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", ctx.userId); // prevents marking others' notifications

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
