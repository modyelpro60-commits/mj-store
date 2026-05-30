import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
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