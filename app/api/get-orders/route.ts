import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"] as const;

type OrderStatus = (typeof ALLOWED_STATUSES)[number];
const ORDER_VIEW_ROLES: UserRole[] = ["admin", "moderator"];

function findCreatedLikeDate(row: Record<string, unknown>): string | null {
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
  if (typeof value === "number") return String(value);
  return null;
}

export async function GET(req: Request) {
  // Admin + Moderator can view orders
  await requireRole(req, ORDER_VIEW_ROLES);

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

    const normalized = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;

      const createdAt = findCreatedLikeDate(r);

      return {
        ...r,
        created_at: createdAt,
        handled_by: (r.handled_by ?? null) as unknown,
        handled_by_name: (r.handled_by_name ?? null) as unknown,
        handled_at: (r.handled_at ?? null) as unknown,
      };
    });

    return NextResponse.json({
      success: true,
      data: normalized,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: message, data: [] },
      { status: 500 }
    );
  }
}
