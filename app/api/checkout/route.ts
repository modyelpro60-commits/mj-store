import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../lib/auth/requireAuthContext";
import { notifyAllStaff }    from "../../../lib/notifications/notifyStaff";

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const VALID_METHODS = ["vodafone", "instapay"];

/* ─── POST /api/checkout ─────────────────────────────────────────────────────
 * Turns the user's cart into orders with proof of payment already attached.
 * body: { method, payment_proof_url }
 *
 * Flow:
 *   1. Insert order rows (status "Awaiting Payment", proof URL stored)
 *   2. Clear cart
 *   3. Create chat room
 *   4. Post proof image as customer's first message
 *   5. Post 3 system messages
 *   6. Notify all staff
 * ─────────────────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireActiveUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as {
    method?: string;
    payment_proof_url?: string;
  };

  const method = VALID_METHODS.includes(raw.method ?? "") ? raw.method! : null;
  if (!method) {
    return NextResponse.json({ success: false, error: "اختر طريقة الدفع" }, { status: 400 });
  }

  const paymentProofUrl =
    typeof raw.payment_proof_url === "string" && raw.payment_proof_url.trim()
      ? raw.payment_proof_url.trim()
      : null;

  if (!paymentProofUrl) {
    return NextResponse.json(
      { success: false, error: "يجب رفع صورة إثبات الدفع قبل إنشاء الطلب." },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const now = new Date().toISOString();

  /* ── 1. Customer name from profile ── */
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", ctx.userId)
    .maybeSingle();

  const customerName = ((profile?.full_name as string) ?? "").trim() || "عميل";

  /* ── 2. Read cart ── */
  const { data: cart, error: cartErr } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .eq("user_id", ctx.userId);

  if (cartErr) {
    return NextResponse.json({ success: false, error: cartErr.message }, { status: 500 });
  }
  if (!cart || cart.length === 0) {
    return NextResponse.json({ success: false, error: "السلة فارغة" }, { status: 400 });
  }

  /* ── 3. Resolve products ── */
  const ids = cart.map((c) => c.product_id);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price")
    .in("id", ids);
  const pMap = new Map<number, { id: number; name: string; price: number }>();
  (products ?? []).forEach((p: any) => pMap.set(p.id, p));

  /* ── 4. Build order rows ── */
  const orderRef = String(Date.now()).slice(-6);

  const rows = cart
    .map((c) => {
      const p = pMap.get(c.product_id);
      if (!p) return null;
      const qty  = Math.max(1, toNum(c.quantity));
      const unit = toNum(p.price);
      return {
        user_id:           ctx.userId,
        customer_name:     customerName,
        product_id:        c.product_id,
        product_name:      qty > 1 ? `${p.name} ×${qty}` : p.name,
        price:             unit * qty,
        status:            "Awaiting Payment",
        payment_method:    method,
        order_ref:         orderRef,
        payment_proof_url: paymentProofUrl,
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "لا توجد منتجات صالحة في السلة" }, { status: 400 });
  }

  /* ── 5. Insert orders ── */
  // Resilient: drop payment_proof_url / order_ref if column doesn't exist yet.
  const { data: insertedOrders, error: insertErr } = await supabase
    .from("orders")
    .insert(rows)
    .select("id");

  if (insertErr) {
    // Fallback: drop new columns
    const fallback = rows.map(({ order_ref, payment_proof_url, ...rest }) => rest);
    const { error: fallbackErr } = await supabase.from("orders").insert(fallback);
    if (fallbackErr) {
      return NextResponse.json({ success: false, error: fallbackErr.message }, { status: 500 });
    }
  }

  const firstOrderId = (insertedOrders?.[0] as any)?.id ?? null;

  /* ── 6. Clear cart ── */
  await supabase.from("cart_items").delete().eq("user_id", ctx.userId);

  /* ── 7. Create chat room + seed messages ── */
  const total = rows.reduce((s, r) => s + toNum(r.price), 0);
  const firstProductName = (pMap.values().next().value as any)?.name ?? "المنتج";

  let roomId: string | null = null;
  try {
    const { data: room, error: roomErr } = await supabase
      .from("chat_rooms")
      .insert({
        user_id:              ctx.userId,
        order_ref:            orderRef,
        title:                `طلب: ${firstProductName}`,
        status:               "open",
        last_message_at:      now,
        last_sender_is_staff: false,
        user_last_read_at:    now,
      })
      .select("id")
      .maybeSingle();

    if (roomErr || !room?.id) {
      console.warn("[checkout] chat room creation failed:", roomErr?.message);
    } else {
      roomId = room.id as string;

      /* 7a. Proof image — posted as customer's first message */
      await supabase.from("chat_messages").insert({
        room_id:   roomId,
        sender_id: ctx.userId,
        body:      "📸 صورة إثبات الدفع",
        image_url: paymentProofUrl,
      });

      /* 7b. Three system messages */
      const systemMsgs = [
        `✅ تم إنشاء طلبك بنجاح!\n\nرقم الطلب: #${orderRef} — الإجمالي: ${total.toLocaleString()} EGP`,
        "📸 تم استلام صورة إثبات الدفع.",
        "⏳ سيراجع أحد المسؤولين عملية الدفع قريباً — يرجى الانتظار في هذه المحادثة.",
      ];
      for (const body of systemMsgs) {
        await supabase.from("chat_messages").insert({
          room_id:   roomId,
          sender_id: null,
          is_system: true,
          body,
        });
      }

      /* 7c. Bump room timestamp */
      await supabase
        .from("chat_rooms")
        .update({ last_message_at: now, last_sender_is_staff: true })
        .eq("id", roomId);
    }
  } catch (chatErr) {
    console.warn("[checkout] chat setup error:", chatErr);
  }

  /* ── 8. Notify staff ── */
  void notifyAllStaff({
    type:    "new_order",
    title:   "طلب جديد 🛒",
    message: `${customerName} طلب "${firstProductName}" — الإجمالي ${total.toLocaleString()} EGP.`,
    link:    roomId ? `/chat?room=${roomId}` : "/admin/orders",
    excludeUserId: ctx.userId,
  });

  return NextResponse.json({ success: true, count: rows.length, orderRef, roomId });
}
