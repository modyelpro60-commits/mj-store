import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../../lib/auth/requireAuthContext";

const STAFF_ROLES = ["admin", "moderator", "helper"];

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/* ─── GET /api/chat/rooms ────────────────────────────────────────────────────
 * Staff → all rooms ordered by last_message_at desc
 * User  → their own room (id only)
 * ─────────────────────────────────────────────────────────────────────────── */
export async function GET(req: Request) {
  let ctx;
  try {
    ctx = await requireActiveUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();
  const isStaff  = STAFF_ROLES.includes(ctx.role);

  if (isStaff) {
    // Try with the new columns; fall back to base columns if migration pending.
    let rooms: any[] | null = null;
    const full = await supabase
      .from("chat_rooms")
      .select(`id, user_id, last_message_at, status, last_sender_is_staff, staff_last_read_at, customer_cleared_at`)
      .order("last_message_at", { ascending: false });
    if (!full.error) {
      rooms = full.data;
    } else {
      const base = await supabase
        .from("chat_rooms")
        .select(`id, user_id, last_message_at`)
        .order("last_message_at", { ascending: false });
      if (base.error) {
        return NextResponse.json({ success: false, error: base.error.message }, { status: 500 });
      }
      rooms = base.data;
    }

    const roomList = rooms ?? [];

    // Fetch profile names separately (no FK relationship chat_rooms → profiles)
    const userIds = roomList.map((r: any) => r.user_id);
    const nameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      (profs ?? []).forEach((p: any) => nameMap.set(p.id, p.full_name));
    }

    // Fetch the last message for each room (for preview)
    const data = await Promise.all(
      roomList.map(async (r: any) => {
        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("body")
          .eq("room_id", r.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const unread =
          r.status === "open" &&
          !r.last_sender_is_staff &&
          (!r.staff_last_read_at ||
            new Date(r.last_message_at) > new Date(r.staff_last_read_at));

        // Still within the 1-minute "closing" grace window?
        const clearAt = (r.customer_cleared_at as string | null) ?? null;
        const inGrace = clearAt ? Date.now() < new Date(clearAt).getTime() : false;

        return {
          id:            r.id,
          userId:        r.user_id,
          userName:      nameMap.get(r.user_id) ?? "مستخدم",
          lastMessageAt: r.last_message_at,
          lastMsg:       lastMsg?.body ?? null,
          status:        (r.status as string) ?? "open",
          inGrace,
          unread,
        };
      })
    );

    // Hide rooms that have no messages yet (phantom rooms)
    let visible = data.filter((r) => r.lastMsg !== null);

    // Only admins keep closed conversations. Moderators & helpers keep them
    // during the 1-minute grace window, then they disappear.
    if (ctx.role !== "admin") {
      visible = visible.filter((r) => r.status === "open" || r.inGrace);
    }

    return NextResponse.json({ success: true, data: visible });
  }

  // Regular user — return their own room
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    data: room ? [{ id: room.id, userId: ctx.userId }] : [],
  });
}

/* ─── POST /api/chat/rooms ───────────────────────────────────────────────────
 * Upsert a chat room for the current user. Returns { roomId }.
 * ─────────────────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireActiveUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();

  // Try upsert first
  const { data: upserted, error: upsertErr } = await supabase
    .from("chat_rooms")
    .upsert({ user_id: ctx.userId }, { onConflict: "user_id" })
    .select("id")
    .single();

  if (!upsertErr && upserted) {
    return NextResponse.json({ success: true, roomId: upserted.id });
  }

  // Fallback: select existing
  const { data: existing, error: selectErr } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("user_id", ctx.userId)
    .single();

  if (existing) {
    return NextResponse.json({ success: true, roomId: existing.id });
  }

  return NextResponse.json(
    { success: false, error: selectErr?.message ?? "Could not create room" },
    { status: 500 }
  );
}
