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

    console.log("[create-product] Creating new product...");
    console.log("[create-product] Payload:", JSON.stringify({ name: body.name, category: body.category, price: body.price }));

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
      console.error("[create-product] Failed to insert product:", error?.message || "No product returned");
      return NextResponse.json({
        success: false,
        error: error?.message || "Failed to create product",
      });
    }

    const productId = insertedProducts[0].id;
    console.log("[create-product] Product created successfully with ID:", productId);

    // Step 2: Insert features (soft-fail if product_features table doesn't exist)
    try {
      const featureRows = buildFeatureRows(productId, body.features);

      if (featureRows.length > 0) {
        console.log("[create-product] Inserting", featureRows.length, "features for product ID:", productId);
        const { error: featureError } = await supabase
          .from("product_features")
          .insert(
            featureRows.map((row) => ({
              ...row,
              product_id: productId,
            }))
          );

        if (featureError) {
          console.warn("[create-product] Failed to insert features (table may not exist):", featureError.message);
          console.warn("[create-product] Product was created successfully; continuing without features.");
        } else {
          console.log("[create-product] Features inserted successfully.");
        }
      } else {
        console.log("[create-product] No features to insert.");
      }
    } catch (featureError) {
      console.warn("[create-product] Non-critical feature operation failed:", featureError instanceof Error ? featureError.message : "Unknown");
      console.warn("[create-product] Product was created successfully; continuing without features.");
    }

    console.log("[create-product] Product creation completed successfully for ID:", productId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[create-product] Unexpected error:", message);
    return NextResponse.json({
      success: false,
      error: message,
    });
  }
}
