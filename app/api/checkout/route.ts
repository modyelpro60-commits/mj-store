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
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "لا توجد منتجات صالحة في السلة" }, { status: 400 });
  }

  const { error: insertErr } = await supabase.from("orders").insert(rows);
  if (insertErr) {
    return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
  }

  // Clear the cart now that the order is placed
  await supabase.from("cart_items").delete().eq("user_id", ctx.userId);

  return NextResponse.json({ success: true, count: rows.length });
}
