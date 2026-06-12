import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "../../../../../lib/auth/requireAuthContext";
import { createNotification } from "../../../../../../lib/notifications/createNotification";
import { logActivity } from "../../../../../lib/logs/logActivity";

/* ─── POST /api/chat/rooms/[roomId]/reject-payment ───────────────────────────
 * Admin ONLY — reject payment proof, set order to payment_rejected,
 * post system message, notify customer.
 * The customer can upload a new screenshot; once they do the order returns
 * to "Awaiting Payment" and the admin controls reappear.
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

  /* ── Find order info (all rows for this order_ref) ── */
  const { data: orderRows } = await db
    .from("orders")
    .select("id, product_name, user_id")
    .eq("order_ref", room.order_ref as string);
  const orderRow = orderRows?.[0] ?? null;

  /* ── Update order status → payment_rejected ── */
  await db
    .from("orders")
    .update({
      status: "payment_rejected",
      handled_by: ctx.userId,
      handled_by_name: staffName,
      handled_at: now,
    })
    .eq("order_ref", room.order_ref as string);

  /* ── System message ── */
  await db.from("chat_messages").insert({
    room_id:   roomId,
    sender_id: null,
    is_system: true,
    body: [
      "❌ تم رفض إثبات الدفع.",
      "",
      `السبب: ${reason}`,
      "",
      "تم رفض إثبات الدفع، يرجى رفع لقطة شاشة جديدة لإثبات الدفع.",
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
      message: `السبب: ${reason}. يرجى رفع لقطة شاشة جديدة.`,
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
