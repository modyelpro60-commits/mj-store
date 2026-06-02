import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../lib/auth/requireAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"] as const;
type OrderStatus = (typeof ALLOWED_STATUSES)[number];

export async function POST(req: Request) {
  // Admin-only
  await requireAdmin(req);

  const body = (await req.json()) as { id?: number; status?: string };

  const id = body.id;
  const status = body.status;

  if (typeof id !== "number") {
    return NextResponse.json(
      { success: false, error: "Valid order id is required" },
      { status: 400 }
    );
  }

  if (!status || !ALLOWED_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json(
      { success: false, error: "Invalid order status" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: status as OrderStatus,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }

  return NextResponse.json({
    success: true,
  });
}
