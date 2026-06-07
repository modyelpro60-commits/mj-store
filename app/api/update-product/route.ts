import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";
import { buildFeatureRows } from "../../lib/products/featureHelpers";
import { logActivity } from "../../lib/logs/logActivity";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_MUTATION_ROLES: UserRole[] = ["admin", "moderator"];

export async function POST(req: Request) {
  // Admin + Moderator
  const ctx = await requireRole(req, PRODUCT_MUTATION_ROLES);

  try {
    const body = await req.json();
    const { id, name, description, full_description, price, image, category, badge, features } = body;

    console.log("[update-product] Starting update for product ID:", id);
    console.log("[update-product] Payload:", JSON.stringify({ name, description, full_description, price, image, category, badge, features }));

    // Step 1: Update the products table
    console.log("[update-product] Updating products table...");
    const { error: updateError } = await supabase
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

    if (updateError) {
      console.error("[update-product] Failed to update products row:", updateError.message);
      return NextResponse.json({
        success: false,
        error: updateError.message,
      });
    }
    console.log("[update-product] Products table updated successfully.");

    // Step 2: Handle product_features (soft-fail if table doesn't exist)
    try {
      const featureRows = buildFeatureRows(id, features);

      console.log("[update-product] Deleting existing features for product ID:", id);
      const { error: deleteError } = await supabase
        .from("product_features")
        .delete()
        .eq("product_id", id);

      if (deleteError) {
        console.warn("[update-product] Failed to delete features (table may not exist):", deleteError.message);
      } else {
        console.log("[update-product] Existing features deleted successfully.");
      }

      if (featureRows.length > 0 && !deleteError) {
        console.log("[update-product] Inserting", featureRows.length, "new features...");
        const { error: insertError } = await supabase
          .from("product_features")
          .insert(featureRows);

        if (insertError) {
          console.warn("[update-product] Failed to insert features:", insertError.message);
        } else {
          console.log("[update-product] Features inserted successfully.");
        }
      } else if (featureRows.length > 0 && deleteError) {
        console.warn("[update-product] Skipping feature insert because delete failed (table likely missing).");
      } else {
        console.log("[update-product] No features to insert.");
      }
    } catch (featureError) {
      // Soft-fail: features are not critical to product update
      console.warn("[update-product] Non-critical feature operation failed:", featureError instanceof Error ? featureError.message : "Unknown feature error");
      console.warn("[update-product] Continuing with product update success regardless.");
    }

    await logActivity({
      actorId:     ctx.userId,
      actorRole:   ctx.role,
      action:      "product.update",
      targetType:  "product",
      targetId:    id,
      targetLabel: name,
    });

    console.log("[update-product] Product update completed successfully for ID:", id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[update-product] Unexpected error:", message);
    return NextResponse.json({
      success: false,
      error: message,
    });
  }
}
