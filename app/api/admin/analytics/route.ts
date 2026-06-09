import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "../../../lib/auth/requireAuthContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  await requireRole(req, ["admin", "moderator"]);

  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "30d";

  let since: string | null = null;
  const now = Date.now();
  if (period === "7d")  since = new Date(now - 7  * 86400_000).toISOString();
  if (period === "30d") since = new Date(now - 30 * 86400_000).toISOString();

  // Fetch products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, image, category, is_active");

  // Fetch events
  let eventsQ = supabase.from("product_events").select("product_id, event_type");
  if (since) eventsQ = eventsQ.gte("created_at", since);
  const { data: events } = await eventsQ;

  // Fetch views (deduped)
  let viewsQ = supabase.from("product_views").select("product_id");
  if (since) viewsQ = viewsQ.gte("created_at", since);
  const { data: views } = await viewsQ;

  // Build per-product aggregates
  type Stats = { views: number; add_to_cart: number; checkout_start: number; purchases: number };
  const statsMap: Record<string, Stats> = {};

  for (const p of products ?? []) {
    statsMap[p.id] = { views: 0, add_to_cart: 0, checkout_start: 0, purchases: 0 };
  }

  for (const v of views ?? []) {
    if (statsMap[v.product_id]) statsMap[v.product_id].views++;
  }

  for (const e of events ?? []) {
    if (!statsMap[e.product_id]) continue;
    if      (e.event_type === "add_to_cart")     statsMap[e.product_id].add_to_cart++;
    else if (e.event_type === "checkout_start")  statsMap[e.product_id].checkout_start++;
    else if (e.event_type === "purchase")        statsMap[e.product_id].purchases++;
  }

  const productAnalytics = (products ?? []).map((p) => {
    const s = statsMap[p.id] ?? { views: 0, add_to_cart: 0, checkout_start: 0, purchases: 0 };
    const conversion_rate = s.views > 0 ? Math.round((s.purchases / s.views) * 1000) / 10 : 0;
    return { id: p.id, name: p.name, price: p.price, image: p.image, category: p.category, is_active: p.is_active, ...s, conversion_rate };
  });

  // Funnel totals
  const funnel = {
    views:          (views ?? []).length,
    add_to_cart:    (events ?? []).filter((e) => e.event_type === "add_to_cart").length,
    checkout_start: (events ?? []).filter((e) => e.event_type === "checkout_start").length,
    purchases:      (events ?? []).filter((e) => e.event_type === "purchase").length,
  };

  // Insights
  const byViews       = [...productAnalytics].sort((a, b) => b.views - a.views);
  const bySales       = [...productAnalytics].sort((a, b) => b.purchases - a.purchases);
  const withMinViews  = productAnalytics.filter((p) => p.views >= 5);
  const bestCvr       = [...withMinViews].sort((a, b) => b.conversion_rate - a.conversion_rate);
  const worstCvr      = [...withMinViews].sort((a, b) => a.conversion_rate - b.conversion_rate);

  return NextResponse.json({
    success: true,
    period,
    products: productAnalytics,
    funnel,
    insights: {
      topViewed:       byViews.slice(0, 5),
      topSelling:      bySales.slice(0, 5),
      bestConversion:  bestCvr.slice(0, 5),
      worstConversion: worstCvr.slice(0, 5),
    },
  });
}
