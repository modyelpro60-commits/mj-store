import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { id, name, description, full_description, price, image, category, badge, features } = body;

    const { error } = await supabase
      .from("products")
      .update({
        name,
        description,
        full_description,
        price,
        image,
        category,
        badge,
        features,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json({
      success: false,
      error: message,
    });
  }
}
