import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../lib/auth/requireAdmin";
import { buildFeatureRows } from "../../lib/products/featureHelpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // Admin-only
  await requireAdmin(req);

  try {
    const body = await req.json();
    const featureRows = buildFeatureRows(body.id, body.features);

    const { id, name, description, full_description, price, image, category, badge } = body;

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
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      });
    }

    const { error: deleteError } = await supabase
      .from("product_features")
      .delete()
      .eq("product_id", id);

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: deleteError.message,
      });
    }

    if (featureRows.length > 0) {
      const { error: insertError } = await supabase
        .from("product_features")
        .insert(featureRows);

      if (insertError) {
        return NextResponse.json({
          success: false,
          error: insertError.message,
        });
      }
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
