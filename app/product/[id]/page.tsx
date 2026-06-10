import { supabase } from "../../../lib/supabase";
import ProductDetailsViewV2 from "../../../components/storefront/ProductDetailsViewV2";
import { ProductViewTracker } from "../../../components/analytics/ProductViewTracker";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: product }, { data: featuresData }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase
      .from("product_features")
      .select("name")
      .eq("product_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-4xl font-black">Product Not Found</h1>
      </main>
    );
  }

  const features = (featuresData ?? []).map((f: { name: string }) => f.name);
  const productWithFeatures = { ...(product as Record<string, unknown>), features };

  return (
    <main className="min-h-screen bg-black text-white">
      <ProductViewTracker productId={(product as any).id} />
      <ProductDetailsViewV2 product={productWithFeatures as any} />
    </main>
  );
}
