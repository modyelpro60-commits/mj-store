import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_STATUSES = ["Awaiting Payment", "Pending", "Processing", "Completed", "Cancelled"] as const;
type OrderStatus = (typeof ALLOWED_STATUSES)[number];

const UPDATE_ACTOR_ROLES: UserRole[] = ["admin", "moderator"];

export async function POST(req: Request) {
  const ctx = await requireRole(req, UPDATE_ACTOR_ROLES);
  const body = (await req.json()) as { id?: number; status?: string };
  const id = body.id;
  const status = body.status;

  if (typeof id !== "number") {
    return NextResponse.json(
      { success: false, error: "Valid order id is required" },
      { status: 400 }
    );
  }

  if (!status || !ALLOWED_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json(
      { success: false, error: "Invalid order status" },
      { status: 400 }
    );
  }

  const { data: currentOrder, error: fetchError } = await supabase
    .from("orders")
    .select("status, product_id")
    .eq("id", id)
    .single();

  if (fetchError || !currentOrder) {
    return NextResponse.json(
      { success: false, error: fetchError?.message ?? "Order not found" },
      { status: 404 }
    );
  }

  const previousStatus = currentOrder.status;
  const productId = currentOrder.product_id;

  const isBecomingCompleted =
    status?.toLowerCase() === "completed" && previousStatus?.toLowerCase() !== "completed";

  if (isBecomingCompleted && productId != null) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("sales_count")
      .eq("id", productId)
      .single();

    if (!productError && product) {
      const currentSales = Number(product.sales_count) || 0;
      const { error: salesUpdateError } = await supabase
        .from("products")
        .update({ sales_count: currentSales + 1 })
        .eq("id", productId);

      if (salesUpdateError) {
        return NextResponse.json(
          { success: false, error: salesUpdateError.message }
        );
      }
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", ctx.userId)
    .single();

  const handledByName = profile?.full_name ?? null;

  if (profileError) {
    return NextResponse.json(
      { success: false, error: profileError.message }
    );
  }

  const handledAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: status as OrderStatus,
      handled_by: ctx.userId,
      handled_by_name: handledByName,
      handled_at: handledAt,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { success: false, error: updateError.message }
    );
  }

  return NextResponse.json({ success: true });
}
