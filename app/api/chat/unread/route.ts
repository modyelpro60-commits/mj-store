import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../../lib/auth/requireAuthContext";

const STAFF_ROLES = ["admin", "moderator", "helper"];

/* ─── GET /api/chat/unread ───────────────────────────────────────────────────
 * Staff → number of OPEN customer rooms with an unread customer message.
 * User  → number of unread staff replies in their own room.
 * ─────────────────────────────────────────────────────────────────────────── */
export async function GET(req: Request) {
  let ctx;
  try {
    ctx = await requireActiveUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const isStaff = STAFF_ROLES.includes(ctx.role);

  if (isStaff) {
    const { data: rooms, error: roomsErr } = await supabase
      .from("chat_rooms")
      .select("id, last_message_at, staff_last_read_at, last_sender_is_staff, status");

    if (roomsErr) {
      // Migration pending — no unread tracking yet
      return NextResponse.json({ success: true, count: 0 });
    }

    const candidates = (rooms ?? []).filter(
      (r) =>
        r.status === "open" &&
        !r.last_sender_is_staff &&
        (!r.staff_last_read_at || new Date(r.last_message_at) > new Date(r.staff_last_read_at))
    );

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Only count rooms that actually have at least one message
    const ids = candidates.map((r) => r.id);
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("room_id")
      .in("room_id", ids);
    const withMsgs = new Set((msgs ?? []).map((m: any) => m.room_id));

    const count = candidates.filter((r) => withMsgs.has(r.id)).length;
    return NextResponse.json({ success: true, count });
  }

  // Regular user — count their rooms that have an unread staff reply.
  let rooms: any[] | null = null;
  const fullU = await supabase
    .from("chat_rooms")
    .select("id, last_message_at, user_last_read_at, last_sender_is_staff, customer_cleared_at")
    .eq("user_id", ctx.userId);
  if (!fullU.error) {
    rooms = fullU.data as any[];
  } else {
    const baseU = await supabase
      .from("chat_rooms")
      .select("id, last_message_at, user_last_read_at, last_sender_is_staff")
      .eq("user_id", ctx.userId);
    if (baseU.error) return NextResponse.json({ success: true, count: 0 });
    rooms = baseU.data as any[];
  }

  let count = 0;
  for (const room of rooms ?? []) {
    if (!room.last_sender_is_staff) continue;
    let cutoff = (room.user_last_read_at as string | null) ?? null;
    const cleared = (room.customer_cleared_at as string | null) ?? null;
    if (cleared && (!cutoff || new Date(cleared) > new Date(cutoff))) cutoff = cleared;
    if (cutoff && new Date(room.last_message_at) <= new Date(cutoff)) continue;
    count++;
  }

  return NextResponse.json({ success: true, count });
}
