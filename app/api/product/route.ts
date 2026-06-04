import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRODUCT_CREATE_ROLES: UserRole[] = ["admin", "moderator"];

export async function POST(req: Request) {
  // Admin + Moderator can create products (Active only)
  await requireRole(req, PRODUCT_CREATE_ROLES);

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
