import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../lib/auth/requireAuthContext";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function auth(req: Request) {
  return requireActiveUser(req);
}

/* ─── GET /api/cart ──────────────────────────────────────────────────────────
 * Returns the user's cart items (with product details) + totals.
 * ─────────────────────────────────────────────────────────────────────────── */
export async function GET(req: Request) {
  let ctx;
  try {
    ctx = await auth(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();

  const { data: rows, error } = await supabase
    .from("cart_items")
    .select("id, product_id, quantity, created_at")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const cartRows = rows ?? [];
  const productIds = cartRows.map((r) => r.product_id);

  const productMap = new Map<number, any>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, original_price, image, category")
      .in("id", productIds);
    (products ?? []).forEach((p: any) => productMap.set(p.id, p));
  }

  const items = cartRows
    .map((r) => {
      const p = productMap.get(r.product_id);
      if (!p) return null; // product was deleted
      const price         = toNum(p.price);
      const originalPrice = p.original_price ? toNum(p.original_price) : null;
      const quantity      = toNum(r.quantity);
      return {
        id:             r.id,
        productId:      r.product_id,
        name:           p.name as string,
        image:          (p.image as string) ?? null,
        category:       (p.category as string) ?? null,
        price,
        original_price: originalPrice,
        quantity,
        lineTotal:      price * quantity,
      };
    })
    .filter(Boolean) as Array<{ price: number; quantity: number; lineTotal: number }>;

  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const count = items.reduce((s, it) => s + it.quantity, 0);

  return NextResponse.json({ success: true, items, subtotal, count });
}

/* ─── POST /api/cart ─────────────────────────────────────────────────────────
 * Add a product (increments quantity if already in cart).
 * body: { productId, quantity? }
 * ─────────────────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await auth(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as { productId?: number | string; quantity?: number };
  const productId = toNum(raw.productId);
  const addQty = Math.max(1, Math.floor(toNum(raw.quantity) || 1));

  if (!productId) {
    return NextResponse.json({ success: false, error: "Invalid product" }, { status: 400 });
  }

  const supabase = serviceClient();

  // Ensure the product exists
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  // Increment if already in cart, else insert
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", ctx.userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: toNum(existing.quantity) + addQty, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ user_id: ctx.userId, product_id: productId, quantity: addQty });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/* ─── PATCH /api/cart ────────────────────────────────────────────────────────
 * Set an item's absolute quantity (0 or less removes it).
 * body: { productId, quantity }
 * ─────────────────────────────────────────────────────────────────────────── */
export async function PATCH(req: Request) {
  let ctx;
  try {
    ctx = await auth(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as { productId?: number | string; quantity?: number };
  const productId = toNum(raw.productId);
  const quantity = Math.floor(toNum(raw.quantity));

  if (!productId) {
    return NextResponse.json({ success: false, error: "Invalid product" }, { status: 400 });
  }

  const supabase = serviceClient();

  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("user_id", ctx.userId).eq("product_id", productId);
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("user_id", ctx.userId)
    .eq("product_id", productId);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

/* ─── DELETE /api/cart ───────────────────────────────────────────────────────
 * Remove one item ({ productId }) or clear the whole cart ({ clear: true }).
 * ─────────────────────────────────────────────────────────────────────────── */
export async function DELETE(req: Request) {
  let ctx;
  try {
    ctx = await auth(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as { productId?: number | string; clear?: boolean };
  const supabase = serviceClient();

  if (raw.clear) {
    await supabase.from("cart_items").delete().eq("user_id", ctx.userId);
    return NextResponse.json({ success: true });
  }

  const productId = toNum(raw.productId);
  if (!productId) {
    return NextResponse.json({ success: false, error: "Invalid product" }, { status: 400 });
  }

  await supabase.from("cart_items").delete().eq("user_id", ctx.userId).eq("product_id", productId);
  return NextResponse.json({ success: true });
}
