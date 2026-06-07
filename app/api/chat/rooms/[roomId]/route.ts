import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../../../lib/auth/requireAuthContext";
import { logActivity } from "../../../../lib/logs/logActivity";

const STAFF_ROLES = ["admin", "moderator", "helper"];

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/* ─── PATCH /api/chat/rooms/[roomId] ─────────────────────────────────────────
 * action: "read"   → mark the room read for the current viewer
 * action: "close"  → staff resolve/close the chat (logged)
 * action: "reopen" → staff reopen the chat (logged)
 * ─────────────────────────────────────────────────────────────────────────── */
export async function PATCH(
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

  const raw = (await req.json().catch(() => ({}))) as { action?: string };
  const action = raw.action;

  // Resilient room fetch (status column may not exist before the migration)
  let room: any = null;
  const fullRoom = await supabase
    .from("chat_rooms")
    .select("id, user_id, status")
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

  // Non-staff may only touch their own room
  if (!isStaff && room.user_id !== ctx.userId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();

  /* ── Mark read ── */
  if (action === "read") {
    const patch = isStaff
      ? { staff_last_read_at: now }
      : { user_last_read_at: now };
    await supabase.from("chat_rooms").update(patch).eq("id", roomId);
    return NextResponse.json({ success: true });
  }

  /* ── Close / Reopen (staff only) ── */
  if (action === "close" || action === "reopen") {
    if (!isStaff) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const [{ data: me }, { data: cust }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", ctx.userId).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", room.user_id).maybeSingle(),
    ]);
    const staffName = (me?.full_name as string) ?? "الإدارة";
    const custName  = (cust?.full_name as string) ?? "مستخدم";

    // The chat stays visible (with a "closing in 1 minute" banner) for the
    // customer + moderator/helper until this moment, then it clears for them.
    const graceEnd = new Date(Date.now() + 60_000).toISOString();

    let result;
    if (action === "close") {
      // customer_cleared_at = when the conversation disappears for non-admins.
      // Fall back gracefully if that column is missing.
      result = await supabase
        .from("chat_rooms")
        .update({ status: "closed", closed_by: ctx.userId, closed_by_name: staffName, closed_at: now, customer_cleared_at: graceEnd })
        .eq("id", roomId);
      if (result.error) {
        result = await supabase
          .from("chat_rooms")
          .update({ status: "closed", closed_by: ctx.userId, closed_by_name: staffName, closed_at: now })
          .eq("id", roomId);
      }
    } else {
      // Reopen: do NOT clear customer_cleared_at, so old messages stay hidden
      // from the customer even after the chat becomes active again.
      result = await supabase
        .from("chat_rooms")
        .update({ status: "open", closed_by: null, closed_by_name: null, closed_at: null })
        .eq("id", roomId);
    }

    if (result.error) {
      return NextResponse.json(
        { success: false, error: "هذه الميزة تتطلب تحديث قاعدة البيانات (migration)." },
        { status: 400 }
      );
    }

    await logActivity({
      actorId:     ctx.userId,
      action:      action === "close" ? "chat.close" : "chat.reopen",
      targetType:  "chat_room",
      targetId:    roomId,
      targetLabel: custName,
      actorName:   staffName,
      actorRole:   ctx.role,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}

/* ─── DELETE /api/chat/rooms/[roomId] ────────────────────────────────────────
 * Permanently delete a conversation (room + all its messages). Staff only.
 * ─────────────────────────────────────────────────────────────────────────── */
export async function DELETE(
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

  // Deleting a conversation is admin-only
  if (ctx.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const supabase = serviceClient();

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, user_id")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
  }

  const { data: cust } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", room.user_id)
    .maybeSingle();

  // Deleting the room cascades to its messages (FK on delete cascade)
  const { error } = await supabase.from("chat_rooms").delete().eq("id", roomId);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await logActivity({
    actorId:     ctx.userId,
    actorRole:   ctx.role,
    action:      "chat.delete",
    targetType:  "chat_room",
    targetId:    roomId,
    targetLabel: (cust?.full_name as string) ?? "مستخدم",
  });

  return NextResponse.json({ success: true });
}
