import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "../../../../../lib/auth/requireAuthContext";
import { createNotification } from "../../../../../../lib/notifications/createNotification";
import { logActivity } from "../../../../../lib/logs/logActivity";

/* ─── POST /api/chat/rooms/[roomId]/reject-payment ───────────────────────────
 * Admin ONLY — reject payment with a reason, set order to Rejected,
 * post system message, notify customer.
 * Body: { reason: string }
 * ─────────────────────────────────────────────────────────────────────────── */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  let ctx;
  try {
    ctx = await requireRole(req, ["admin"]);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as { reason?: string };
  const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ success: false, error: "سبب الرفض مطلوب" }, { status: 400 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: room } = await db
    .from("chat_rooms")
    .select("id, order_ref, user_id")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
  }
  if (!room.order_ref) {
    return NextResponse.json({ success: false, error: "هذه ليست محادثة طلب" }, { status: 400 });
  }

  const { data: prof } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", ctx.userId)
    .maybeSingle();
  const staffName = (prof?.full_name as string) ?? "الإدارة";
  const now = new Date().toISOString();

  /* ── Find order info ── */
  const { data: orderRow } = await db
    .from("orders")
    .select("id, product_name, user_id")
    .eq("order_ref", room.order_ref as string)
    .maybeSingle();

  /* ── Update order status → Rejected ── */
  await db
    .from("orders")
    .update({ status: "Rejected", handled_by: ctx.userId, handled_by_name: staffName, handled_at: now })
    .eq("order_ref", room.order_ref as string);

  /* ── System message in chat ── */
  await db.from("chat_messages").insert({
    room_id:   roomId,
    sender_id: null,
    is_system: true,
    body: [
      "❌ تم رفض إثبات الدفع.",
      "",
      "السبب:",
      reason,
      "",
      "يرجى رفع صورة جديدة أو التواصل مع الدعم.",
    ].join("\n"),
  });

  await db
    .from("chat_rooms")
    .update({ last_message_at: now, last_sender_is_staff: true })
    .eq("id", roomId);

  /* ── Notify customer ── */
  const customerId = (orderRow?.user_id ?? room.user_id) as string | null;
  if (customerId) {
    void createNotification({
      userId:  customerId,
      type:    "payment_rejected",
      title:   "تم رفض إثبات الدفع ❌",
      message: `تم رفض إثبات الدفع لطلب "${orderRow?.product_name ?? "طلبك"}". السبب: ${reason}`,
      link:    `/chat?room=${roomId}`,
    });
  }

  /* ── Audit log ── */
  void logActivity({
    actorId:     ctx.userId,
    actorRole:   ctx.role,
    actorName:   staffName,
    action:      "order.reject_payment",
    targetType:  "order",
    targetId:    orderRow?.id ?? room.order_ref,
    targetLabel: (orderRow?.product_name as string) ?? String(room.order_ref),
  });

  return NextResponse.json({ success: true });
}
