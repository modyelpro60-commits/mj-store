import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../lib/auth/requireAuthContext";

const RECENT_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"] as const;
type OrderStatus = (typeof RECENT_STATUSES)[number];

function findCreatedLikeDate(row: Record<string, unknown>): string | null {
  // Avoid hard-coding a specific DB column name (schema may differ).
  const keys = Object.keys(row);

  const candidateKey = keys.find((k) => {
    const lower = k.toLowerCase();
    const hasCreated = lower.includes("created");
    const hasAtOrDate = lower.includes("at") || lower.includes("date");
    return hasCreated && hasAtOrDate;
  });

  if (!candidateKey) return null;

  const value = row[candidateKey];
  if (typeof value === "string") return value;
  // timestamps could come back as numbers or Date-like; best-effort stringify
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

    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("id, full_name")
      .eq("id", userId)
      .single();

    if (profileError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const customerName = profile?.full_name ?? null;

    // If we can't map the user to orders via customer_name, return empty-but-successful data.
    if (!customerName) {
      return NextResponse.json({
        success: true,
        data: {
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          recentOrders: [],
        },
      });
    }

    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "5");
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 5;

    const { data: recentData, error: recentError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("customer_name", customerName)
      .order("id", { ascending: false })
      .limit(limit);

    if (recentError) {
      return NextResponse.json({ success: false, error: recentError.message }, { status: 500 });
    }

    const recentOrders = (recentData ?? []).map((o) => {
      const row = o as Record<string, unknown>;
      const productName = String(row.product_name ?? "");
      const status = (row.status as OrderStatus | undefined) ?? "Pending";

      return {
        productName,
        status,
        price: row.price as unknown,
        createdAt: findCreatedLikeDate(row),
      };
    });

    const totalOrdersPromise = supabaseService
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_name", customerName);

    const completedOrdersPromise = supabaseService
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_name", customerName)
      .eq("status", "Completed");

    const pendingOrdersPromise = supabaseService
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_name", customerName)
      .eq("status", "Pending");

    const [{ count: totalCount }, { count: completedCount }, { count: pendingCount }] =
      await Promise.all([totalOrdersPromise, completedOrdersPromise, pendingOrdersPromise]);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders: Number(totalCount ?? 0),
        completedOrders: Number(completedCount ?? 0),
        pendingOrders: Number(pendingCount ?? 0),
        recentOrders,
      },
    });
  } catch (err) {
    // requireActiveUser throws a Response for forbidden cases (suspended/banned/etc.)
    if (err instanceof Response) return err;

    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
