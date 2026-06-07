import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "../../../../../lib/auth/requireAuthContext";

const STAFF_ROLES = ["admin", "moderator", "helper"] as const;

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { id, reviewId } = await params;
  const productId   = Number(id);
  const reviewIdNum = Number(reviewId);

  if (!Number.isFinite(productId) || !Number.isFinite(reviewIdNum)) {
    return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
  }

  let ctx;
  try {
    ctx = await requireRole(req, [...STAFF_ROLES]);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the review belongs to this product
  const { data: review } = await supabase
    .from("product_reviews")
    .select("id")
    .eq("id", reviewIdNum)
    .eq("product_id", productId)
    .single();

  if (!review) {
    return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", reviewIdNum);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
