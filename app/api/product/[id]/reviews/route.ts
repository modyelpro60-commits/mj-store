import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../../../lib/auth/requireAuthContext";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId)) {
    return NextResponse.json({ success: false, error: "Invalid product ID" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Try with replies join first; fall back to simple query if table doesn't exist yet
  let rawReviews: any[] = [];

  const withReplies = await supabase
    .from("product_reviews")
    .select(`
      id, rating, comment, created_at, user_id,
      profiles(full_name, role),
      review_replies(
        id, body, created_at, user_id,
        profiles(full_name, role)
      )
    `)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (!withReplies.error) {
    rawReviews = withReplies.data ?? [];
  } else {
    // review_replies table may not exist yet — fall back to simple query
    const simple = await supabase
      .from("product_reviews")
      .select("id, rating, comment, created_at, user_id, profiles(full_name)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (simple.error) {
      return NextResponse.json({ success: false, error: simple.error.message }, { status: 500 });
    }
    rawReviews = simple.data ?? [];
  }

  const normalized = rawReviews.map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    authorName: r.profiles?.full_name ?? "Anonymous",
    authorRole: (r.profiles?.role as string) ?? null,
    createdAt: r.created_at,
    replies: ((r.review_replies ?? []) as any[])
      .slice()
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((reply: any) => ({
        id: reply.id,
        body: reply.body,
        authorName: reply.profiles?.full_name ?? "فريق الدعم",
        role: (reply.profiles?.role as string) ?? "helper",
        createdAt: reply.created_at,
      })),
  }));

  return NextResponse.json({ success: true, data: normalized });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId)) {
    return NextResponse.json({ success: false, error: "Invalid product ID" }, { status: 400 });
  }

  let ctx;
  try {
    ctx = await requireActiveUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { rating?: number; comment?: string };

  const rating = body.rating;
  const comment = body.comment?.trim();

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  if (!comment || comment.length < 2) {
    return NextResponse.json({ success: false, error: "Comment must be at least 2 characters" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    user_id: ctx.userId,
    rating,
    comment,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
