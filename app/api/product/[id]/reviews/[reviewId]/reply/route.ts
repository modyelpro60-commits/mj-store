import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "../../../../../../lib/auth/requireAuthContext";
import { createNotification } from "../../../../../../../lib/notifications/createNotification";

const STAFF_ROLES = ["admin", "moderator", "helper"] as const;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const { id, reviewId } = await params;
  const productId  = Number(id);
  const reviewIdNum = Number(reviewId);

  if (!Number.isFinite(productId) || !Number.isFinite(reviewIdNum)) {
    return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
  }

  // Only admin / moderator / helper can reply
  let ctx;
  try {
    ctx = await requireRole(req, [...STAFF_ROLES]);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await req.json()) as { body?: string };
  const body = raw.body?.trim() ?? "";

  if (body.length < 2) {
    return NextResponse.json({ success: false, error: "الرد قصير جداً" }, { status: 400 });
  }
  if (body.length > 1000) {
    return NextResponse.json({ success: false, error: "الرد طويل جداً (الحد الأقصى 1000 حرف)" }, { status: 400 });
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

  const { error } = await supabase.from("review_replies").insert({
    review_id: reviewIdNum,
    user_id:   ctx.userId,
    body,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // — Notification for the review author (additive) ——————————————
  const { data: reviewRow } = await supabase
    .from("product_reviews")
    .select("user_id, product_id")
    .eq("id", reviewIdNum)
    .maybeSingle();

  if (reviewRow?.user_id) {
    void createNotification({
      userId:  reviewRow.user_id as string,
      type:    "review_reply",
      title:   "Review Reply 💬",
      message: "A staff member replied to your product review.",
      link:    `/product/${reviewRow.product_id}`,
    });
  }
  // ——————————————————————————————————————————————————————————————

  return NextResponse.json({ success: true });
}
