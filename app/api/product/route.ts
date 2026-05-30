import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();

  const { error } = await supabase.from("products").insert([
    {
      name: body.name,
      description: body.description,
      image: body.image,
      price: Number(body.price),
      sales_count: 0,
    },
  ]);

  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.json({
    success: true,
  });
}