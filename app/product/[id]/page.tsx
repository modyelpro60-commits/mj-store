import { supabase } from "../../../lib/supabase";
import { normalizeProductFeatures } from "../../lib/products/featureHelpers";
import ProductDetailsView from "../../../components/storefront/ProductDetailsView";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (product) {
    const { data: featureRows } = await supabase
      .from("product_features")
      .select("product_id,name,sort_order")
      .eq("product_id", id);

    (product as any).features = normalizeProductFeatures({
      ...(product as any),
      product_features: featureRows ?? [],
    });
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-4xl font-black">Product Not Found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <ProductDetailsView product={product as any} />
    </main>
  );
}
