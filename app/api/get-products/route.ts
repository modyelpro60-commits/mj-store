import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeProductFeatures } from "../../lib/products/featureHelpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // IMPORTANT:
    // Avoid `select("*, product_features(...)")` because PostgREST relationship
    // may not be cached/available (PGRST200). Instead, fetch separately and merge.
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (productsError || !products) return NextResponse.json([]);

    if (products.length === 0) return NextResponse.json([]);

    const productIds = products.map((p: any) => p.id).filter(Boolean);

    const { data: featureRows, error: featuresError } = await supabase
      .from("product_features")
      .select("product_id,name,sort_order")
      .in("product_id", productIds);

    if (featuresError || !featureRows) {
      // Still return products; just no features.
      return NextResponse.json(
        products.map((product: any) => ({
          ...product,
          features: [],
        }))
      );
    }

    const featureMap = new Map<string, any[]>();
    for (const row of featureRows as any[]) {
      const key = String(row.product_id);
      const current = featureMap.get(key) ?? [];
      current.push(row);
      featureMap.set(key, current);
    }

    const normalized = (products as any[]).map((product) => {
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

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json([]);
  }
}
