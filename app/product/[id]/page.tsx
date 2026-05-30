import { supabase } from "../../../lib/supabase";
import Link from "next/link";

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
      <main className="min-h-screen bg-[#0B0B0F] text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">
          Product Not Found
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          <div>
            <img
              src={product.image}
              alt={product.name}
              className="w-full rounded-3xl border border-zinc-800"
            />
          </div>

          <div>
            <div className="inline-block px-4 py-2 rounded-full bg-purple-600 mb-6">
              Best Seller
            </div>

            <h1 className="text-5xl font-black">
              {product.name}
            </h1>

            <p className="text-zinc-400 text-lg mt-6">
              {product.description}
            </p>

            <div className="mt-6">
              <p className="text-zinc-500">
                Sold {product.sales_count} times
              </p>
            </div>

            <div className="mt-8">
              <span className="text-5xl font-black">
                {product.price} EGP
              </span>
            </div>

            <Link href={`/checkout?product=${product.id}`}>
              <button className="mt-10 bg-purple-600 hover:bg-purple-700 px-10 py-4 rounded-2xl text-xl font-bold transition-all">
                Buy Now
              </button>
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}