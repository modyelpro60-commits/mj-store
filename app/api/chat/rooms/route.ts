import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../../lib/auth/requireAuthContext";

const STAFF_ROLES = ["admin", "moderator", "helper"];
const AUTO_CLOSE_MS = 3 * 60 * 60 * 1000; // 3h unpaid → auto-close

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const ROOM_COLS =
  "id, user_id, last_message_at, status, last_sender_is_staff, staff_last_read_at, user_last_read_at, customer_cleared_at, order_ref, title, created_at";

/* ─── GET /api/chat/rooms ────────────────────────────────────────────────── */
export async function GET(req: Request) {
  let ctx;
  try {
    ctx = await requireActiveUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();
  const isStaff = STAFF_ROLES.includes(ctx.role);

  // Fetch rooms (resilient to pending migrations)
  let rooms: any[] | null = null;
  const q = (cols: string) => {
    let b = supabase.from("chat_rooms").select(cols).order("last_message_at", { ascending: false });
    if (!isStaff) b = b.eq("user_id", ctx.userId);
    return b;
  };
  const full = await q(ROOM_COLS);
  if (!full.error) {
    rooms = full.data as any[];
  } else {
    const base = await q("id, user_id, last_message_at");
    if (base.error) return NextResponse.json({ success: false, error: base.error.message }, { status: 500 });
    rooms = base.data as any[];
  }
  const roomList = rooms ?? [];

  // Names
  const userIds = Array.from(new Set(roomList.map((r) => r.user_id)));
  const nameMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    (profs ?? []).forEach((p: any) => nameMap.set(p.id, p.full_name));
  }

  // Order statuses (by order_ref)
  const orderRefs = Array.from(new Set(roomList.map((r) => r.order_ref).filter(Boolean)));
  const orderStatusMap = new Map<string, string>();
  if (orderRefs.length > 0) {
    const { data: ords } = await supabase.from("orders").select("order_ref, status").in("order_ref", orderRefs);
    (ords ?? []).forEach((o: any) => {
      if (!orderStatusMap.has(o.order_ref)) orderStatusMap.set(o.order_ref, o.status);
    });
  }

  // Lazy 3h auto-close for unpaid order rooms
  const now = Date.now();
  for (const r of roomList) {
    const oStatus = r.order_ref ? orderStatusMap.get(r.order_ref) : null;
    if (
      r.order_ref &&
      r.status === "open" &&
      oStatus === "Awaiting Payment" &&
      r.created_at &&
      now - new Date(r.created_at).getTime() > AUTO_CLOSE_MS
    ) {
      r.status = "closed";
      await supabase.from("chat_rooms").update({ status: "closed", closed_by_name: "النظام" }).eq("id", r.id);
    }
  }

  // Build data + last message previews
  const data = await Promise.all(
    roomList.map(async (r) => {
      const { data: lastMsg } = await supabase
        .from("chat_messages")
        .select("body")
        .eq("room_id", r.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const unread = isStaff
        ? r.status === "open" &&
          !r.last_sender_is_staff &&
          (!r.staff_last_read_at || new Date(r.last_message_at) > new Date(r.staff_last_read_at))
        : r.last_sender_is_staff &&
          (!r.user_last_read_at || new Date(r.last_message_at) > new Date(r.user_last_read_at));

      const clearAt = (r.customer_cleared_at as string | null) ?? null;
      const inGrace = clearAt ? Date.now() < new Date(clearAt).getTime() : false;

      return {
        id: r.id,
        userId: r.user_id,
        userName: nameMap.get(r.user_id) ?? "مستخدم",
        title: (r.title as string) ?? null,
        orderRef: (r.order_ref as string) ?? null,
        orderStatus: r.order_ref ? orderStatusMap.get(r.order_ref) ?? null : null,
        lastMessageAt: r.last_message_at,
        lastMsg: lastMsg?.body ?? null,
        status: (r.status as string) ?? "open",
        inGrace,
        unread: !!unread,
      };
    })
  );

  let visible = data.filter((r) => r.lastMsg !== null);

  // Moderators/helpers don't keep closed conversations (admins do).
  if (isStaff && ctx.role !== "admin") {
    visible = visible.filter((r) => r.status === "open" || r.inGrace);
  }

  return NextResponse.json({ success: true, data: visible });
}

/* ─── POST /api/chat/rooms ───────────────────────────────────────────────────
 * Find-or-create the customer's GENERAL support room (order_ref IS NULL).
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

  // Existing general room?
  const existing = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("user_id", ctx.userId)
    .is("order_ref", null)
    .maybeSingle();

  if (!existing.error && existing.data) {
    return NextResponse.json({ success: true, roomId: existing.data.id });
  }

  // Create one (fall back to the legacy shape if order_ref column is missing)
  let created = await supabase
    .from("chat_rooms")
    .insert({ user_id: ctx.userId, order_ref: null, title: "الدعم الفني" })
    .select("id")
    .maybeSingle();
  if (created.error) {
    created = await supabase.from("chat_rooms").upsert({ user_id: ctx.userId }, { onConflict: "user_id" }).select("id").maybeSingle();
  }

  if (created.data) {
    return NextResponse.json({ success: true, roomId: created.data.id });
  }
  return NextResponse.json({ success: false, error: created.error?.message ?? "Could not create room" }, { status: 500 });
}
