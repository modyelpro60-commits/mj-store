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
      <main className="min-h-screen bg-[#050507] text-white flex items-center justify-center">
        <h1 className="text-4xl font-black">
          Product Not Found
        </h1>
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

      <div className="max-w-[1600px] mx-auto px-8 py-20">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* Product Image */}

          <div>

            <img
              src={product.image}
              alt={product.name}
              className="w-full h-[650px] object-contain p-12 rounded-3xl border border-purple-500/20 shadow-2xl bg-zinc-900"
            />

          </div>

          {/* Product Info */}

          <div>

            {product.sales_count >= 500 ? (
  <div className="inline-flex px-4 py-2 rounded-full bg-yellow-500 text-black font-bold mb-6">
    👑 TOP SELLER
  </div>
) : product.sales_count >= 100 ? (
  <div className="inline-flex px-4 py-2 rounded-full bg-purple-600 text-white font-bold mb-6">
    🔥 TRENDING
  </div>
) : null}
            <h1 className="text-6xl font-black">
              {product.name}
            </h1>

            <div className="flex gap-1 mt-6 text-2xl text-yellow-400">
              ⭐⭐⭐⭐⭐
            </div>

            <p className="text-zinc-500 mt-2">
              Trusted by hundreds of customers
            </p>

            <div className="mt-8">

  <h2 className="text-2xl font-bold mb-4">
    Product Description
  </h2>

  <p className="text-zinc-400 text-lg leading-relaxed">
    {product.full_description}
  </p>

</div>

            <div className="mt-8">
              <p className="text-zinc-500">
                Sold {product.sales_count} times
              </p>
            </div>

            {/* Features */}

{/* Features */}

<div className="mt-10">

  <h2 className="text-2xl font-bold mb-5">
    What's Included
  </h2>

  <div className="space-y-3">

    {product.features?.split(",").map((feature: string) => (

      <div
        key={feature}
        className="bg-zinc-900/60 border border-purple-500/10 rounded-2xl p-4"
      >
        ✓ {feature}
      </div>

    ))}

  </div>

</div>

            {/* Price */}

            <div className="mt-12">

              <p className="text-zinc-500 mb-2">
                Price
              </p>

              <h2 className="text-6xl font-black text-purple-400">
                {product.price} EGP
                <div className="flex gap-4 mt-6 flex-wrap">

  <div className="bg-zinc-900 border border-purple-500/10 px-4 py-3 rounded-xl">
    Sold {product.sales_count}
  </div>

  <div className="bg-zinc-900 border border-purple-500/10 px-4 py-3 rounded-xl">
    Instant Delivery
  </div>

</div>
              </h2>

            </div>

            {/* Buy Button */}

            <Link href={`/checkout?product=${product.id}`}>

              <button className="mt-10 w-full bg-purple-600 hover:bg-purple-700 transition-all duration-300 px-10 py-5 rounded-2xl text-2xl font-bold">
                Buy Now →
              </button>

            </Link>

          </div>

        </div>

        {/* Trust Section */}

        <div className="grid md:grid-cols-3 gap-6 mt-24">

          <div className="bg-zinc-900/60 border border-purple-500/10 rounded-3xl p-8">
            <h3 className="text-2xl font-bold mb-4">
              ⚡ Fast Delivery
            </h3>

            <p className="text-zinc-400">
              Receive your product instantly after payment.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-purple-500/10 rounded-3xl p-8">
            <h3 className="text-2xl font-bold mb-4">
              🔒 Safe Payments
            </h3>

            <p className="text-zinc-400">
              Secure and trusted payment experience.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-purple-500/10 rounded-3xl p-8">
            <h3 className="text-2xl font-bold mb-4">
              ⭐ Premium Service
            </h3>

            <p className="text-zinc-400">
              High quality digital products and support.
            </p>
          </div>

        </div>

      </div>

    </main>
  );
}