import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeProductFeatures } from "../../lib/products/featureHelpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log("[get-products] Fetching all products...");

    // IMPORTANT:
    // Avoid `select("*, product_features(...)")` because PostgREST relationship
    // may not be cached/available (PGRST200). Instead, fetch separately and merge.
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (productsError || !products) {
      console.error("[get-products] Failed to fetch products:", productsError?.message);
      return NextResponse.json([]);
    }

    console.log("[get-products] Fetched", products.length, "products");

    if (products.length === 0) return NextResponse.json([]);

    const productIds = products.map((p: any) => p.id).filter(Boolean);

    // Soft-fail: if product_features table doesn't exist, just return products with no features
    let normalized;
    try {
      const { data: featureRows, error: featuresError } = await supabase
        .from("product_features")
        .select("product_id,name,sort_order")
        .in("product_id", productIds);

      if (featuresError || !featureRows) {
        console.warn("[get-products] Failed to fetch features (table may not exist):", featuresError?.message);
        console.warn("[get-products] Returning products without features.");
        normalized = products.map((product: any) => ({
          ...product,
          features: [],
        }));
      } else {
        console.log("[get-products] Fetched", featureRows.length, "feature rows");

        const featureMap = new Map<string, any[]>();
        for (const row of featureRows as any[]) {
          const key = String(row.product_id);
          const current = featureMap.get(key) ?? [];
          current.push(row);
          featureMap.set(key, current);
        }

        normalized = (products as any[]).map((product) => {
          const rowsForProduct = featureMap.get(String(product.id)) ?? [];
          return {
            ...product,
            // normalizeProductFeatures expects `product.product_features` rows
            features: normalizeProductFeatures({
              ...product,
              product_features: rowsForProduct,
            }),
          };
        });
      }
    } catch (featuresError) {
      console.warn("[get-products] Non-critical error fetching features:", featuresError instanceof Error ? featuresError.message : "Unknown");
      console.warn("[get-products] Returning products without features.");
      normalized = products.map((product: any) => ({
        ...product,
        features: [],
      }));
    }

    return NextResponse.json(normalized);
  } catch (err) {
    console.error("[get-products] Unexpected error:", err instanceof Error ? err.message : "Unknown");
    return NextResponse.json([]);
  }
}
