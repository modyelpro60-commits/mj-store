import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ORDER_CREATION_ROLES: UserRole[] = ["user", "helper", "moderator", "admin"];

const PHONE_REGEX = /^\+?\d{8,15}$/;

function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(value.trim());
}

export async function POST(req: Request) {
  const { userId } = await requireRole(req, ORDER_CREATION_ROLES);

  const body = await req.json();

  const customerName = typeof body.customer_name === "string"
    ? body.customer_name.trim()
    : "";

  if (!customerName) {
    return NextResponse.json({
      success: false,
      error: "Customer name is required",
    });
  }

  const customerPhone = typeof body.customer_phone === "string"
    ? body.customer_phone.trim()
    : "";

  if (!customerPhone) {
    return NextResponse.json({
      success: false,
      error: "Please enter a valid phone number.",
    });
  }

  if (!isValidPhone(customerPhone)) {
    return NextResponse.json({
      success: false,
      error: "Please enter a valid phone number.",
    });
  }

  const { error } = await supabase.from("orders").insert([
    {
      user_id: userId,
      customer_name: customerName,
      customer_phone: customerPhone,
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
