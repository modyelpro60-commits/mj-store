import { supabase } from "../../../lib/supabase";
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

  if (!product) {
    return (
      <main className="min-h-screen bg-[#050507] text-white flex items-center justify-center">
        <h1 className="text-4xl font-black">Product Not Found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
            linear-gradient(rgba(168,85,247,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168,85,247,0.12) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-purple-700/20 rounded-full blur-[250px]" />
      </div>

      <ProductDetailsView product={product as any} />
    </main>
  );
}
