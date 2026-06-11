import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";
import { logActivity } from "../../lib/logs/logActivity";
import { sanitizeCategory } from "../../lib/categories";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_MUTATION_ROLES: UserRole[] = ["admin", "moderator"];

export async function POST(req: Request) {
  // Admin + Moderator can create products
  const ctx = await requireRole(req, PRODUCT_MUTATION_ROLES);

  try {
    const body = await req.json();

    console.log("[create-product] Creating new product...");
    console.log("[create-product] Payload:", JSON.stringify({
      name: body.name,
      price: body.price,
      original_price: body.original_price,
      is_active: body.is_active,
    }));

    const { data: insertedProducts, error } = await supabase
      .from("products")
      .insert([
        {
          name:              body.name,
          description:       body.description,
          short_description: body.short_description ?? null,
          price:             body.price,
          original_price:    body.original_price ?? null,
          image:             body.image,
          is_active:         body.is_active !== false,
          category:          sanitizeCategory(body.category),
          badge:             body.badge?.trim() || null,
          sales_count:       0,
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

    // Insert features if provided
    const features: string[] = Array.isArray(body.features)
      ? (body.features as unknown[]).filter((f): f is string => typeof f === "string" && f.trim().length > 0)
      : [];
    if (features.length > 0) {
      const rows = features.map((name, sort_order) => ({ product_id: productId, name: name.trim(), sort_order }));
      const { error: featErr } = await supabase.from("product_features").insert(rows);
      if (featErr) console.warn("[create-product] Failed to insert features:", featErr.message);
    }

    await logActivity({
      actorId:     ctx.userId,
      actorRole:   ctx.role,
      action:      "product.create",
      targetType:  "product",
      targetId:    productId,
      targetLabel: body.name,
    });

    console.log("[create-product] Product creation completed for ID:", productId);
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
