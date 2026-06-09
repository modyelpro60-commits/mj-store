import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_EVENTS = ["view", "add_to_cart", "checkout_start", "purchase"] as const;
type EventType = typeof VALID_EVENTS[number];

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      product_id?: string;
      event_type?: string;
      session_id?: string;
      user_id?: string | null;
    };

    const { product_id, event_type, session_id, user_id } = body;

    if (!product_id || !event_type || !session_id) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    if (!VALID_EVENTS.includes(event_type as EventType)) {
      return NextResponse.json({ success: false, error: "Invalid event type" }, { status: 400 });
    }

    const normalizedUserId = user_id || null;

    // For views: dedup — skip if same user/session viewed this product in last 30 minutes
    if (event_type === "view") {
      const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      let dupQuery = supabase
        .from("product_views")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product_id)
        .gte("created_at", since);

      if (normalizedUserId) {
        dupQuery = dupQuery.eq("user_id", normalizedUserId);
      } else {
        dupQuery = dupQuery.eq("session_id", session_id).is("user_id", null);
      }

      const { count } = await dupQuery;
      if (count && count > 0) {
        return NextResponse.json({ success: true, skipped: true });
      }

      await supabase.from("product_views").insert({
        product_id,
        user_id: normalizedUserId,
        session_id,
      });
    }

    await supabase.from("product_events").insert({
      product_id,
      user_id: normalizedUserId,
      session_id,
      event_type,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
