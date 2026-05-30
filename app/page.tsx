import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data: products } = await supabase
    .from("products")
    .select("*");

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white">
      <nav className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-black text-purple-500">
            MJ STORE
          </h1>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-4xl font-black mb-8">
          Products
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {products?.map((product: any) => (
            <div
              key={product.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-56 object-cover"
              />

              <div className="p-6">
                <h3 className="text-2xl font-bold">
                  {product.name}
                </h3>

                <p className="text-zinc-400 mt-2">
                  {product.description}
                </p>

                <p className="mt-3 text-sm text-zinc-500">
                  Sold {product.sales_count} times
                </p>

                <p className="text-3xl font-black mt-4">
                  {product.price} EGP
                </p>

                <button className="w-full mt-5 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold">
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}