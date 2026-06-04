import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ORDER_CREATION_ROLES: UserRole[] = ["user", "helper", "moderator", "admin"];

export async function POST(req: Request) {
  // Enforce active user + allowed roles (server-side)
  await requireRole(req, ORDER_CREATION_ROLES);

  const body = await req.json();

  const { error } = await supabase.from("orders").insert([
    {
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      product_id: body.product_id,
      product_name: body.product_name,
      price: body.price,
      status: "Pending",
    },
  ]);

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
