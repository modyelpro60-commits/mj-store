import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";
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
    const { id, name, description, short_description, price, original_price, image, is_active, features } = body;

    console.log("[update-product] Starting update for product ID:", id);
    console.log("[update-product] Payload:", JSON.stringify({ name, description, price, original_price, image, is_active }));

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name,
        description,
        short_description: short_description ?? null,
        price,
        original_price:    original_price ?? null,
        image,
        is_active:         typeof is_active === "boolean" ? is_active : true,
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

    // Sync features: delete existing, re-insert new ones
    const featureList: string[] = Array.isArray(features)
      ? (features as unknown[]).filter((f): f is string => typeof f === "string" && f.trim().length > 0)
      : [];

    const { error: delFeatErr } = await supabase
      .from("product_features")
      .delete()
      .eq("product_id", id);
    if (delFeatErr) console.warn("[update-product] Failed to delete old features:", delFeatErr.message);

    if (featureList.length > 0) {
      const rows = featureList.map((name: string, sort_order: number) => ({
        product_id: id,
        name: name.trim(),
        sort_order,
      }));
      const { error: insFeatErr } = await supabase.from("product_features").insert(rows);
      if (insFeatErr) console.warn("[update-product] Failed to insert features:", insFeatErr.message);
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
