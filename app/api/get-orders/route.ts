import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../lib/auth/requireAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"] as const;

type OrderStatus = (typeof ALLOWED_STATUSES)[number];

export async function GET(req: Request) {
  // Admin-only
  await requireAdmin(req);

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const limitParam = Number(searchParams.get("limit") ?? "0");

    let query = supabase.from("orders").select("*").order("id", { ascending: false });

    if (status && ALLOWED_STATUSES.includes(status as OrderStatus)) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,product_name.ilike.%${search}%`
      );
    }

    if (Number.isFinite(limitParam) && limitParam > 0) {
      query = query.limit(limitParam);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, data: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: message, data: [] },
      { status: 500 }
    );
  }
}
