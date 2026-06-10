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

  // USDT-specific metadata (only present for usdt payment method)
  const usdtAmount  = typeof body.usdt_amount  === "number" ? body.usdt_amount  : null;
  const usdtRate    = typeof body.usdt_rate    === "number" ? body.usdt_rate    : null;
  const usdtFeePct  = typeof body.usdt_fee_pct === "number" ? body.usdt_fee_pct : null;

  // Payment account assignment (from multi-account Round Robin system)
  const suggestedAccountId =
    typeof body.payment_account_id === "string" ? body.payment_account_id.trim() : null;

  /* ── Generate order ref ────────────────────────────────────────── */
  const orderRef = generateOrderRef();
  const db       = svc();
  const now      = new Date().toISOString();

  /* ── Resolve payment account (Round Robin) ─────────────────────── */
  let resolvedAccountId: string | null = null;
  let accountSnapshot: Record<string, unknown> | null = null;

  if (paymentMethod && ["vodafone", "instapay", "usdt"].includes(paymentMethod)) {
    try {
      // 1. Try the account the user was shown at checkout (suggested)
      if (suggestedAccountId) {
        const { data: suggested } = await db
          .from("payment_accounts")
          .select("id, method, name, value, qr_image, is_active")
          .eq("id", suggestedAccountId)
          .eq("is_active", true)
          .maybeSingle();

        if (suggested) {
          resolvedAccountId = suggested.id as string;
          accountSnapshot = {
            id: suggested.id, method: suggested.method,
            name: suggested.name, value: suggested.value,
            qr_image: suggested.qr_image,
          };
        }
      }

      // 2. If suggested not available, pick next via Round Robin
      if (!resolvedAccountId) {
        const { data: rrAccount } = await db
          .from("payment_accounts")
          .select("id, method, name, value, qr_image")
          .eq("method", paymentMethod)
          .eq("is_active", true)
          .order("last_used_at", { ascending: true, nullsFirst: true })
          .limit(1)
          .maybeSingle();

        if (rrAccount) {
          resolvedAccountId = rrAccount.id as string;
          accountSnapshot = {
            id: rrAccount.id, method: rrAccount.method,
            name: rrAccount.name, value: rrAccount.value,
            qr_image: rrAccount.qr_image,
          };
        }
      }
    } catch (accErr) {
      console.warn("[create-order] account resolution failed:", accErr);
    }
  }

  /* ── Insert order ──────────────────────────────────────────────── */
  const { data: newOrder, error: orderErr } = await db
    .from("orders")
    .insert({
      user_id:                   userId,
      customer_name:             customerName,
      customer_phone:            customerPhone,
      product_id:                productId,
      product_name:              productName,
      price,
      status:                    "Awaiting Payment",
      order_ref:                 orderRef,
      payment_method:            paymentMethod,
      payment_proof_url:         paymentProofUrl,
      usdt_amount:               usdtAmount,
      usdt_rate:                 usdtRate,
      usdt_fee_pct:              usdtFeePct,
      payment_account_id:        resolvedAccountId,
      payment_account_snapshot:  accountSnapshot,
    })
    .select("id")
    .single();

  if (orderErr || !newOrder) {
    return NextResponse.json({ success: false, error: orderErr?.message ?? "Failed to create order" });
  }

  const orderId = newOrder.id as number;

  /* ── Update account usage stats (non-blocking, fire-and-forget) ── */
  if (resolvedAccountId) {
    void (async () => {
      const { error: usageErr } = await db
        .rpc("increment_account_usage", { account_id: resolvedAccountId });
      if (usageErr) console.warn("[create-order] usage increment failed:", usageErr.message);
    })();
  }

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
