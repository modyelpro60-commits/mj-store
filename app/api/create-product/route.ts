import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../lib/auth/requireAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // Admin-only
  await requireAdmin(req);

  try {
    const body = await req.json();

    const { error } = await supabase.from("products").insert([
      {
        name: body.name,
        description: body.description,
        full_description: body.full_description,
        price: body.price,
        image: body.image,
        features: body.features,
        category: body.category,
        badge: body.badge,
        sales_count: 0,
        is_active: true,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json({
      success: false,
      error: message,
    });
  }
}
