import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";
import { trackServerEvent }   from "../../../lib/analytics/trackServerEvent";
import { notifyAllStaff }     from "../../../lib/notifications/notifyStaff";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const ORDER_CREATION_ROLES: UserRole[] = ["user", "helper", "moderator", "admin"];

function generateOrderRef(): string {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireRole(req, ORDER_CREATION_ROLES);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = ctx;
  const body = await req.json();

  /* ── Validate ──────────────────────────────────────────────────── */
  const customerName = typeof body.customer_name === "string" && body.customer_name.trim()
    ? body.customer_name.trim()
    : "العميل";

  // Phone is optional — collected only when the customer provides it
  const customerPhone = typeof body.customer_phone === "string"
    ? body.customer_phone.trim() : "";

  const paymentProofUrl: string | null =
    typeof body.payment_proof_url === "string" && body.payment_proof_url.trim()
      ? body.payment_proof_url.trim()
      : null;

  const paymentMethod: string | null =
    typeof body.payment_method === "string" ? body.payment_method.trim() : null;

  const productId   = body.product_id;
  const productName = typeof body.product_name === "string" ? body.product_name.trim() : "";
  const price       = body.price;

  /* ── Generate order ref ────────────────────────────────────────── */
  const orderRef = generateOrderRef();
  const db       = svc();
  const now      = new Date().toISOString();

  /* ── Insert order ──────────────────────────────────────────────── */
  const { data: newOrder, error: orderErr } = await db
    .from("orders")
    .insert({
      user_id:           userId,
      customer_name:     customerName,
      customer_phone:    customerPhone,
      product_id:        productId,
      product_name:      productName,
      price,
      status:            "Awaiting Payment",
      order_ref:         orderRef,
      payment_method:    paymentMethod,
      payment_proof_url: paymentProofUrl,
    })
    .select("id")
    .single();

  if (orderErr || !newOrder) {
    return NextResponse.json({ success: false, error: orderErr?.message ?? "Failed to create order" });
  }

  const orderId = newOrder.id as number;

  /* ── Create order chat room ────────────────────────────────────── */
  let roomId: string | null = null;
  try {
    const { data: chatRoom, error: roomErr } = await db
      .from("chat_rooms")
      .insert({
        user_id:             userId,
        order_ref:           orderRef,
        title:               `طلب: ${productName}`,
        last_message_at:     now,
        last_sender_is_staff: false,
        user_last_read_at:   now,
      })
      .select("id")
      .single();

    if (roomErr || !chatRoom) {
      // Non-fatal — order is still created. Log and continue.
      console.warn("[create-order] chat room creation failed:", roomErr?.message);
    } else {
      roomId = chatRoom.id as string;

      /* ── 1. Payment proof image — posted as customer's first message ── */
      if (paymentProofUrl) {
        await db.from("chat_messages").insert({
          room_id:   roomId,
          sender_id: userId,
          body:      "📸 صورة إثبات الدفع",
          image_url: paymentProofUrl,
        });
      }

      /* ── 2. Three sequential system messages ─────────────────────── */
      const systemMsgs = [
        `✅ تم إنشاء طلبك بنجاح!\n\nرقم الطلب: #${orderId}`,
        "📸 تم استلام صورة إثبات الدفع.",
        "⏳ سيراجع أحد المسؤولين عملية الدفع قريباً — يرجى الانتظار في هذه المحادثة.",
      ];

      for (const msgBody of systemMsgs) {
        await db.from("chat_messages").insert({
          room_id:   roomId,
          sender_id: null,
          is_system: true,
          body:      msgBody,
        });
      }

      /* ── Bump room timestamps ── */
      await db.from("chat_rooms")
        .update({ last_message_at: now, last_sender_is_staff: true })
        .eq("id", roomId);
    }
  } catch (chatErr) {
    console.warn("[create-order] chat setup error:", chatErr);
  }

  /* ── Notify all staff about new order ─────────────────────────── */
  void notifyAllStaff({
    type:    "new_order",
    title:   "طلب جديد 🛒",
    message: `${customerName} طلب "${productName}" — بانتظار مراجعة الدفع.`,
    link:    roomId ? `/chat?room=${roomId}` : "/admin/orders",
  });

  /* ── Analytics ─────────────────────────────────────────────────── */
  void trackServerEvent(String(productId), "purchase", userId);

  return NextResponse.json({ success: true, orderId, roomId });
}
