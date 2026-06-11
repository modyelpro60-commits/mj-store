import { supabase } from "../../../lib/supabase";
import { createClient } from "@supabase/supabase-js";
import ProductDetailsViewV2 from "../../../components/storefront/ProductDetailsViewV2";
import { ProductViewTracker } from "../../../components/analytics/ProductViewTracker";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* Service-role client bypasses RLS to count all completed orders */
  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [{ data: product }, { data: featuresData }, { count: soldCount }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).single(),
      supabase
        .from("product_features")
        .select("name")
        .eq("product_id", id)
        .order("sort_order", { ascending: true }),
      sbAdmin
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("product_id", id)
        .eq("status", "Completed"),
    ]);

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-4xl font-black">Product Not Found</h1>
      </main>
    );
  }

  const features = (featuresData ?? []).map((f: { name: string }) => f.name);
  const productWithFeatures = {
    ...(product as Record<string, unknown>),
    features,
    sales_count: soldCount ?? (product as any).sales_count ?? 0,
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <ProductViewTracker productId={(product as any).id} />
      <ProductDetailsViewV2 product={productWithFeatures as any} />
    </main>
  );
}
