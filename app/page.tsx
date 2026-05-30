export default function Home() {
  const products = [
    {
      name: "Spotify Premium",
      price: "150 EGP",
      sold: 1284,
    },
    {
      name: "Netflix Premium",
      price: "220 EGP",
      sold: 932,
    },
    {
      name: "ChatGPT Plus",
      price: "999 EGP",
      sold: 541,
    },
  ];

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white">
      <nav className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black text-purple-500">
            MJ STORE
          </h1>

          <div className="flex gap-6 text-zinc-300">
            <button>Home</button>
            <button>Products</button>
            <button>Contact</button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-7xl font-black text-purple-500 mb-6">
          MJ STORE
        </h1>

        <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
          Premium Digital Marketplace For Digital Products
        </p>

        <button className="mt-8 bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-bold">
          Shop Now
        </button>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="text-4xl font-black mb-10">
          Best Sellers
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <h3 className="text-2xl font-bold">
                {product.name}
              </h3>

              <p className="text-zinc-400 mt-2">
                Sold {product.sold} times
              </p>

              <p className="text-3xl font-black mt-6">
                {product.price}
              </p>

              <button className="w-full mt-6 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold">
                Buy Now
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}