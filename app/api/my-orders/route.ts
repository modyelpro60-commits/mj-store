import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RECENT_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"] as const;
type OrderStatus = (typeof RECENT_STATUSES)[number];

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;

  const parts = auth.trim().split(" ");
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return null;

  return token || null;
}

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
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve auth user -> profiles email (secure mapping)
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;

    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("id,email,full_name")
      .eq("id", userId)
      .single();

    if (profileError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const customerName = profile?.full_name ?? null;

    // orders currently has no customer_email column and no timestamp column
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

    // Recent orders (belonging to this user)
    // NOTE: select("*") to avoid assuming the exact date column name.
    const { data: recentData, error: recentError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("customer_name", customerName)
      .order("id", { ascending: false })
      .limit(limit);

    if (recentError) {
      return NextResponse.json({ success: false, error: recentError.message }, { status: 500 });
    }

    const recentOrders =
      (recentData ?? []).map((o) => {
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

    // Activity counts (exact)
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
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
