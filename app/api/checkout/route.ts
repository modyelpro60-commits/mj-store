import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../lib/auth/requireAuthContext";

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const VALID_METHODS = ["vodafone", "instapay"];

/* ─── POST /api/checkout ─────────────────────────────────────────────────────
 * Turns the user's cart into orders (status "Awaiting Payment" with the chosen
 * manual payment method), then clears the cart. Admin confirms payment later.
 * body: { method }   // "vodafone" | "instapay"
 * ─────────────────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireActiveUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as { method?: string };
  const method = VALID_METHODS.includes(raw.method ?? "") ? raw.method! : null;
  if (!method) {
    return NextResponse.json({ success: false, error: "اختر طريقة الدفع" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Auto-pull the customer's name from their profile.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", ctx.userId)
    .maybeSingle();

  const customerName = ((profile?.full_name as string) ?? "").trim() || "عميل";

  // Read the cart
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

  // Resolve product details
  const ids = cart.map((c) => c.product_id);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price")
    .in("id", ids);
  const pMap = new Map<number, any>();
  (products ?? []).forEach((p: any) => pMap.set(p.id, p));

  // A short order reference number shared across this checkout's rows.
  const orderRef = String(Date.now()).slice(-6);

  // Build one order row per cart line
  const rows = cart
    .map((c) => {
      const p = pMap.get(c.product_id);
      if (!p) return null;
      const qty = Math.max(1, toNum(c.quantity));
      const unit = toNum(p.price);
      return {
        user_id:        ctx.userId,
        customer_name:  customerName,
        product_id:     c.product_id,
        product_name:   qty > 1 ? `${p.name} ×${qty}` : p.name,
        price:          unit * qty,
        status:         "Awaiting Payment",
        payment_method: method,
        order_ref:      orderRef,
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "لا توجد منتجات صالحة في السلة" }, { status: 400 });
  }

  // Resilient insert: drop order_ref if the column isn't migrated yet.
  let insertErr = (await supabase.from("orders").insert(rows)).error;
  if (insertErr) {
    const fallback = rows.map(({ order_ref, ...rest }) => rest);
    insertErr = (await supabase.from("orders").insert(fallback)).error;
  }
  if (insertErr) {
    return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
  }

  // Clear the cart now that the order is placed
  await supabase.from("cart_items").delete().eq("user_id", ctx.userId);

  // Create a dedicated chat thread for this order + an intro system message.
  let roomId: string | null = null;
  const total = rows.reduce((s, r) => s + toNum(r.price), 0);
  const { data: room } = await supabase
    .from("chat_rooms")
    .insert({
      user_id: ctx.userId,
      order_ref: orderRef,
      title: `طلب #${orderRef}`,
      status: "open",
      last_sender_is_staff: true,
    })
    .select("id")
    .maybeSingle();

  if (room?.id) {
    roomId = room.id;
    await supabase.from("chat_messages").insert({
      room_id: room.id,
      sender_id: null,
      is_system: true,
      body: `📦 طلب #${orderRef} — الإجمالي ${total.toLocaleString()} EGP\n\nالرجاء إرسال صورة إثبات الدفع 📷`,
    });
    await supabase
      .from("chat_rooms")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", room.id);
  }

  return NextResponse.json({ success: true, count: rows.length, orderRef, roomId });
}
