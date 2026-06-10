import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log("[get-products] Fetching all products...");

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error || !products) {
      console.error("[get-products] Failed to fetch products:", error?.message);
      return NextResponse.json([]);
    }

    console.log("[get-products] Fetched", products.length, "products");
    return NextResponse.json(products);
  } catch (err) {
    console.error("[get-products] Unexpected error:", err instanceof Error ? err.message : "Unknown");
    return NextResponse.json([]);
  }
}
