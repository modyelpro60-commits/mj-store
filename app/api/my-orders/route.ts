import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../lib/auth/requireAuthContext";

const RECENT_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"] as const;
type OrderStatus = (typeof RECENT_STATUSES)[number];

function findCreatedLikeDate(row: Record<string, unknown>): string | null {
  const keys = Object.keys(row);
  const candidateKey = keys.find((k) => {
    const lower = k.toLowerCase();
    return lower.includes("created") && (lower.includes("at") || lower.includes("date"));
  });
  if (!candidateKey) return null;
  const value = row[candidateKey];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

export async function GET(req: Request) {
  try {
    const { userId } = await requireActiveUser(req);

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "5");
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 5;

    // ── Strategy 1: query by user_id (reliable, works for all new orders) ──
    const { data: byUserId, error: userIdError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .limit(limit);

    let recentData = byUserId ?? [];

    // ── Strategy 2: fallback — match by profile.full_name (for orders
    //    created before user_id was stored, or if user_id column missing) ──
    if (!userIdError && recentData.length === 0) {
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const customerName = profile?.full_name?.trim() ?? null;

      if (customerName) {
        const { data: byName } = await supabaseService
          .from("orders")
          .select("*")
          .eq("customer_name", customerName)
          .order("id", { ascending: false })
          .limit(limit);

        recentData = byName ?? [];
      }
    }

    // ── If user_id column doesn't exist yet, userIdError will fire.
    //    Fall back fully to customer_name in that case too. ──
    if (userIdError) {
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const customerName = profile?.full_name?.trim() ?? null;

      if (customerName) {
        const { data: byName } = await supabaseService
          .from("orders")
          .select("*")
          .eq("customer_name", customerName)
          .order("id", { ascending: false })
          .limit(limit);

        recentData = byName ?? [];
      }
    }

    // ── Map to response shape ──
    const recentOrders = recentData.map((o) => {
      const row = o as Record<string, unknown>;
      return {
        productName: String(row.product_name ?? ""),
        status: (row.status as OrderStatus | undefined) ?? "Pending",
        price: row.price as unknown,
        createdAt: findCreatedLikeDate(row),
      };
    });

    // ── Counts — mirror the same query strategy ──
    async function countByUserId(statusFilter?: string) {
      let q = supabaseService
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (statusFilter) q = q.eq("status", statusFilter);
      return q;
    }

    async function countByName(name: string, statusFilter?: string) {
      let q = supabaseService
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_name", name);
      if (statusFilter) q = q.eq("status", statusFilter);
      return q;
    }

    // Try user_id counts first
    const [totalRes, completedRes, pendingRes] = await Promise.all([
      countByUserId(),
      countByUserId("Completed"),
      countByUserId("Pending"),
    ]);

    let totalOrders    = Number(totalRes.count ?? 0);
    let completedOrders = Number(completedRes.count ?? 0);
    let pendingOrders   = Number(pendingRes.count ?? 0);

    // If user_id counts are zero and there was no error, try by name for backward compat
    const hasUserIdError = !!totalRes.error;
    if (hasUserIdError || totalOrders === 0) {
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const customerName = profile?.full_name?.trim() ?? null;

      if (customerName) {
        const [tRes, cRes, pRes] = await Promise.all([
          countByName(customerName),
          countByName(customerName, "Completed"),
          countByName(customerName, "Pending"),
        ]);

        // Use whichever source has more orders
        const nameTotal = Number(tRes.count ?? 0);
        if (nameTotal > totalOrders) {
          totalOrders     = nameTotal;
          completedOrders = Number(cRes.count ?? 0);
          pendingOrders   = Number(pRes.count ?? 0);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        pendingOrders,
        recentOrders,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
