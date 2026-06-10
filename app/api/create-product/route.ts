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
  // Admin + Moderator can create products
  const ctx = await requireRole(req, PRODUCT_MUTATION_ROLES);

  try {
    const body = await req.json();

    console.log("[create-product] Creating new product...");
    console.log("[create-product] Payload:", JSON.stringify({
      name: body.name,
      price: body.price,
      original_price: body.original_price,
      status: body.status,
    }));

    const { data: insertedProducts, error } = await supabase
      .from("products")
      .insert([
        {
          name: body.name,
          description: body.description,
          price: body.price,
          original_price: body.original_price ?? null,
          image: body.image,
          status: body.status ?? "available",
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
