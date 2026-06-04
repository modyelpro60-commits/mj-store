import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  requireRole,
  type UserRole,
} from "../../lib/auth/requireAuthContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"] as const;
type OrderStatus = (typeof ALLOWED_STATUSES)[number];

const UPDATE_ACTOR_ROLES: UserRole[] = ["admin", "moderator"];

export async function POST(req: Request) {
  // Admin + Moderator
  const ctx = await requireRole(req, UPDATE_ACTOR_ROLES);

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", ctx.userId)
    .single();

  const handledByName = profile?.full_name ?? null;

  if (profileError) {
    return NextResponse.json({
      success: false,
      error: profileError.message,
    });
  }

  const handledAt = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update({
      status: status as OrderStatus,
      handled_by: ctx.userId,
      handled_by_name: handledByName,
      handled_at: handledAt,
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
