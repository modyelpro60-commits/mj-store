import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";
import { buildFeatureRows } from "../../lib/products/featureHelpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_MUTATION_ROLES: UserRole[] = ["admin", "moderator"];

export async function POST(req: Request) {
  // Admin + Moderator can create products
  await requireRole(req, PRODUCT_MUTATION_ROLES);

  try {
    const body = await req.json();
    const featureRows = buildFeatureRows(0, body.features);

    const { data: insertedProducts, error } = await supabase
      .from("products")
      .insert([
        {
          name: body.name,
          description: body.description,
          full_description: body.full_description,
          price: body.price,
          image: body.image,
          category: body.category,
          badge: body.badge,
          sales_count: 0,
          is_active: true,
        },
      ])
      .select("id");

    if (error || !insertedProducts || insertedProducts.length === 0) {
      return NextResponse.json({
        success: false,
        error: error?.message || "Failed to create product",
      });
    }

    const productId = insertedProducts[0].id;

    if (featureRows.length > 0) {
      const { error: featureError } = await supabase
        .from("product_features")
        .insert(
          featureRows.map((row) => ({
            ...row,
            product_id: productId,
          }))
        );

      if (featureError) {
        return NextResponse.json({
          success: false,
          error: featureError.message,
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
