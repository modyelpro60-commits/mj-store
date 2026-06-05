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
  // Enforce active user + allowed roles (server-side)
  const ctx = await requireRole(req, ORDER_CREATION_ROLES);
  console.error("CREATE_ORDER: authenticated user", ctx.userId, ctx.role);

  const body = await req.json();
  console.error("CREATE_ORDER: request body", JSON.stringify(body));

  // --- Server-side validation (defense against direct API calls) ---
  const customerName = typeof body.customer_name === "string"
    ? body.customer_name.trim()
    : "";

  if (!customerName) {
    console.error("CREATE_ORDER_ERROR: name is empty");
    return NextResponse.json({
      success: false,
      error: "Customer name is required",
    });
  }

  const customerPhone = typeof body.customer_phone === "string"
    ? body.customer_phone.trim()
    : "";

  if (!customerPhone) {
    console.error("CREATE_ORDER_ERROR: phone is empty");
    return NextResponse.json({
      success: false,
      error: "Please enter a valid phone number.",
    });
  }

  if (!isValidPhone(customerPhone)) {
    console.error("CREATE_ORDER_ERROR: invalid phone format", customerPhone);
    return NextResponse.json({
      success: false,
      error: "Please enter a valid phone number.",
    });
  }

  const insertPayload = {
    customer_name: customerName,
    customer_phone: customerPhone,
    product_id: body.product_id,
    product_name: body.product_name,
    price: body.price,
    status: "Pending",
  };
  console.error("CREATE_ORDER: inserting", JSON.stringify(insertPayload));

  const { error } = await supabase.from("orders").insert([insertPayload]);

  if (error) {
    console.error("CREATE_ORDER_ERROR:", error.message, JSON.stringify(error));
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }

  console.error("CREATE_ORDER: success");
  return NextResponse.json({
    success: true,
  });
}
