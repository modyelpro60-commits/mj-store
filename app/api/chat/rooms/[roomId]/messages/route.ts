import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../../../../lib/auth/requireAuthContext";
import { createNotification } from "../../../../../../lib/notifications/createNotification";
import { notifyAllStaff } from "../../../../../../lib/notifications/notifyStaff";

const STAFF_ROLES = ["admin", "moderator", "helper"];

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/* ─── GET /api/chat/rooms/[roomId]/messages ──────────────────────────────────
 * Returns the last 100 messages in a room, with sender profile info.
 * Staff can read any room. Users can only read their own room.
 * ─────────────────────────────────────────────────────────────────────────── */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  let ctx;
  try {
    ctx = await requireActiveUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();
  const isStaff  = STAFF_ROLES.includes(ctx.role);

  const isAdmin = ctx.role === "admin";

  // Try to read the room with the new columns; fall back to base columns if the
  // close/status migration hasn't been applied yet (keeps core chat working).
  let room: any = null;
  const fullRoom = await supabase
    .from("chat_rooms")
    .select("id, user_id, status, closed_by, closed_by_name, closed_at, customer_cleared_at, order_ref, title")
    .eq("id", roomId)
    .maybeSingle();
  if (!fullRoom.error) {
    room = fullRoom.data;
  } else {
    const baseRoom = await supabase
      .from("chat_rooms")
      .select("id, user_id")
      .eq("id", roomId)
      .maybeSingle();
    room = baseRoom.data;
  }

  if (!room) {
    return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
  }
  if (!isStaff && room.user_id !== ctx.userId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Order status for this room (drives the "send payment proof" banner)
  let orderStatus: string | null = null;
  if (room.order_ref) {
    const { data: ord } = await supabase
      .from("orders")
      .select("status")
      .eq("order_ref", room.order_ref)
      .limit(1)
      .maybeSingle();
    orderStatus = (ord?.status as string) ?? null;
  }

  // Grace / clear logic. On close we stamp customer_cleared_at = closed_at + 60s.
  //   • before that moment → chat still shown, with a "closing" banner
  //   • after that moment  → chat disappears (cleared) for everyone but admins
  const isClosed = room.status === "closed";
  const clearAt  = (room.customer_cleared_at as string | null) ?? null;
  const cleared  = !!clearAt && Date.now() >= new Date(clearAt).getTime();
  const inGrace  = isClosed && !!clearAt && !cleared;

  // Role of whoever closed the chat (for the banner text)
  let closedByRole: string | null = null;
  if (isClosed && room.closed_by) {
    const { data: closer } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", room.closed_by)
      .maybeSingle();
    closedByRole = (closer?.role as string) ?? null;
  }

  // Only the actual customer loses the history once the grace period ends.
  // Staff (admin/moderator/helper) always see the full message history; for
  // moderators/helpers the conversation instead disappears from their list.
  let mq = supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (!isStaff && cleared && clearAt) {
    mq = mq.gt("created_at", clearAt);
  }
  const { data: messages, error } = await mq;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const msgList = messages ?? [];

  // Fetch sender profiles separately (no FK relationship chat_messages → profiles)
  const senderIds = Array.from(new Set(msgList.map((m: any) => m.sender_id).filter(Boolean)));
  const profMap = new Map<string, { full_name: string; role: string }>();
  if (senderIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", senderIds);
    (profs ?? []).forEach((p: any) =>
      profMap.set(p.id, { full_name: p.full_name, role: p.role })
    );
  }

  const data = msgList.map((m: any) => {
    const isSystem = !!m.is_system || !m.sender_id;
    const prof = m.sender_id ? profMap.get(m.sender_id) : null;
    return {
      id:         m.id,
      senderId:   m.sender_id,
      senderName: isSystem ? "النظام" : (prof?.full_name ?? "مستخدم"),
      senderRole: isSystem ? null : (prof?.role ?? null),
      body:       m.body,
      imageUrl:   m.image_url ?? null,
      isSystem,
      createdAt:  m.created_at,
      isOwn:      !isSystem && m.sender_id === ctx.userId,
    };
  });

  // Room meta differs by viewer:
  //   • admin       → real closed state (can reopen), full record kept
  //   • others      → "closing" banner during the grace minute, then fresh chat
  const orderInfo = {
    orderRef: (room.order_ref as string) ?? null,
    orderStatus,
    title: (room.title as string) ?? null,
  };

  let roomMeta;
  if (isAdmin) {
    roomMeta = {
      status:       (room.status as string) ?? "open",
      closing:      false,
      closedByName: (room.closed_by_name as string) ?? null,
      closedByRole,
      closedAt:     (room.closed_at as string) ?? null,
      clearAt:      null as string | null,
      ...orderInfo,
    };
  } else if (inGrace) {
    roomMeta = {
      status:       "closing",
      closing:      true,
      closedByName: (room.closed_by_name as string) ?? null,
      closedByRole,
      closedAt:     (room.closed_at as string) ?? null,
      clearAt,
      ...orderInfo,
    };
  } else {
    roomMeta = { status: "open", closing: false, closedByName: null, closedByRole: null, closedAt: null, clearAt: null as string | null, ...orderInfo };
  }

  return NextResponse.json({ success: true, data, room: roomMeta });
}

/* ─── POST /api/chat/rooms/[roomId]/messages ─────────────────────────────────
 * Send a message to a room.
 * Staff can send to any room. Users can only send to their own room.
 * ─────────────────────────────────────────────────────────────────────────── */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  let ctx;
  try {
    ctx = await requireActiveUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();
  const isStaff  = STAFF_ROLES.includes(ctx.role);

  // For customers: verify ownership and read the pending-clear time so we can
  // decide whether their message cancels a pending close.
  let custClearedAt: string | null = null;
  if (!isStaff) {
    let r = await supabase
      .from("chat_rooms")
      .select("id, customer_cleared_at")
      .eq("id", roomId)
      .eq("user_id", ctx.userId)
      .maybeSingle();
    if (r.error) {
      // customer_cleared_at column missing (pre-migration) — fall back
      r = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("id", roomId)
        .eq("user_id", ctx.userId)
        .maybeSingle();
    }
    if (!r.data) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    custClearedAt = ((r.data as any).customer_cleared_at as string | null) ?? null;
  }

  let raw: { body?: string; imageUrl?: string };
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const imageUrl = typeof raw.imageUrl === "string" && raw.imageUrl.trim() ? raw.imageUrl.trim() : null;
  // Image-only messages get a small caption to satisfy the body NOT NULL check.
  const body = ((raw.body ?? "").trim()) || (imageUrl ? "📷 صورة" : "");

  if (!body && !imageUrl) {
    return NextResponse.json({ success: false, error: "Message is empty" }, { status: 400 });
  }
  if (body.length > 2000) {
    return NextResponse.json({ success: false, error: "Message too long" }, { status: 400 });
  }

  // Try to store the image; fall back without it if the column isn't migrated yet.
  let insertErr = (
    await supabase.from("chat_messages").insert({ room_id: roomId, sender_id: ctx.userId, body, image_url: imageUrl })
  ).error;
  if (insertErr && imageUrl) {
    insertErr = (
      await supabase.from("chat_messages").insert({ room_id: roomId, sender_id: ctx.userId, body })
    ).error;
  }

  if (insertErr) {
    return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
  }

  // When a customer attaches a payment screenshot in an order chat, auto-reply.
  if (imageUrl && !isStaff) {
    const { data: rm } = await supabase.from("chat_rooms").select("order_ref").eq("id", roomId).maybeSingle();
    if (rm?.order_ref) {
      await supabase.from("chat_messages").insert({
        room_id: roomId,
        sender_id: null,
        is_system: true,
        body: "✅ تم استلام صورة الدفع. سيراجعها الأدمن للتأكد من عملية الدفع — تابع الشات.",
      });
    }
  }

  // Bump room metadata. The sender just "read" everything.
  const now = new Date().toISOString();
  const roomPatch: Record<string, unknown> = {
    last_message_at:      now,
    last_sender_is_staff: isStaff,
  };
  if (isStaff) {
    roomPatch.staff_last_read_at = now;
  } else {
    // A customer reply re-opens the chat. If a close is still within its
    // 1-minute grace window, the reply cancels it (keep the full history).
    // If the grace already passed, keep customer_cleared_at so old messages
    // stay hidden and the customer just continues with a fresh thread.
    roomPatch.user_last_read_at = now;
    roomPatch.status = "open";
    roomPatch.closed_at = null;
    roomPatch.closed_by = null;
    roomPatch.closed_by_name = null;
    const graceStillActive =
      custClearedAt && Date.now() < new Date(custClearedAt).getTime();
    if (graceStillActive) {
      roomPatch.customer_cleared_at = null;
    }
  }

  const upd = await supabase.from("chat_rooms").update(roomPatch).eq("id", roomId);
  if (upd.error) {
    // New columns may not exist yet (migration pending) — at least bump the time
    await supabase.from("chat_rooms").update({ last_message_at: now }).eq("id", roomId);
  }

  // — Notifications (additive, never throws) ——————————————————————
  if (isStaff) {
    // Staff → customer notification
    const { data: roomRow } = await supabase
      .from("chat_rooms")
      .select("user_id")
      .eq("id", roomId)
      .maybeSingle();

    if (roomRow?.user_id) {
      void createNotification({
        userId:  roomRow.user_id as string,
        type:    "new_message",
        title:   "New Support Message 💬",
        message: "Support team sent you a new message.",
        link:    `/chat?room=${roomId}`,
      });
    }
  } else {
    // Customer → notify all staff
    void notifyAllStaff({
      type:          "new_message",
      title:         "رسالة جديدة من عميل 💬",
      message:       "أرسل أحد العملاء رسالة جديدة في الشات.",
      link:          `/admin/chat`,
      excludeUserId: ctx.userId,
    });
  }
  // ——————————————————————————————————————————————————————————————

  return NextResponse.json({ success: true });
}
