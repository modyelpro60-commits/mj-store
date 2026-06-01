import { supabase } from "../lib/supabase";
import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  Gamepad2,
  Star,
} from "lucide-react";

export default async function Home() {
  const { data: products } = await supabase
    .from("products")
    .select("*");

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 -z-10">

        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
            linear-gradient(rgba(168,85,247,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168,85,247,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-purple-700/30 rounded-full blur-[220px]" />

        <div className="absolute left-[-200px] top-[300px] w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-[180px]" />

        <div className="absolute right-[-200px] top-[300px] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[180px]" />

      </div>

<nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-purple-500/10">

  <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">

    {/* Logo */}

    <div>
      <h1 className="text-3xl font-black tracking-[4px]">
        MJ <span className="text-purple-500">STORE</span>
      </h1>
    </div>

    {/* Links */}

    <div className="hidden md:flex items-center gap-10 text-zinc-400 font-medium">

      <a
        href="#products"
        className="hover:text-white transition"
      >
        Products
      </a>

      <a
        href="#reviews"
        className="hover:text-white transition"
      >
        Reviews
      </a>

      <a
        href="#contact"
        className="hover:text-white transition"
      >
        Contact
      </a>

    </div>

    {/* Right Side */}

    <div className="flex items-center gap-4">

      <button className="border border-purple-500/30 hover:border-purple-500 px-4 py-2 rounded-xl transition">
        EN | AR
      </button>

      <a href="#products">
        <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold transition">
          Buy Now
        </button>
      </a>

    </div>

  </div>

</nav>

      {/* Hero */}

      <section className="py-20">

        <div className="max-w-[1600px] mx-auto px-8 py-10 grid lg:grid-cols-2 gap-10 items-center">

          {/* Left */}

          <div>

            <span className="px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
              Premium Digital Marketplace
            </span>

            <h1 className="mt-8 text-8xl md:text-9xl font-black leading-none">
              MJ
              <br />
              <span className="text-purple-500">
                STORE
              </span>
            </h1>

            <p className="mt-8 text-zinc-400 text-xl max-w-2xl">
              Buy premium subscriptions, digital services,
              Discord Nitro, Spotify, Netflix and ChatGPT Plus
              with instant delivery.
            </p>

            <div className="flex gap-4 mt-10 flex-wrap">
<a href="#products">
  <button className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-2xl font-bold">
    SHOP NOW
  </button>
</a>

              <button className="border border-zinc-700 hover:border-purple-500 px-8 py-4 rounded-2xl font-bold">
                EXPLORE
              </button>

            </div>

          </div>

          {/* Right */}

          <div className="relative hidden lg:flex items-center justify-center">

            <img
              src="/hero.jpg"
              alt="MJ Store Hero"
              className="w-full max-w-[850px] object-contain drop-shadow-[0_0_80px_rgba(168,85,247,0.5)]"
            />

            <div className="absolute inset-0 flex items-center justify-center -z-10">

              <div className="w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />

            </div>

          </div>

        </div>

      </section>

      {/* Why MJ Store */}

      <section className="max-w-[1600px] mx-auto px-8 py-10">

        <h2 className="text-5xl font-black text-center mb-14">
          WHY MJ STORE?
        </h2>
<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

  {/* Card 1 */}

  <div className="w-24 h-24 object-contain transition-all duration-700 group-hover:scale-125 group-hover:rotate-6">

    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-b from-purple-500/10 to-transparent" />

    <div className="relative z-10">

      <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">

        <Zap
          size={38}
          className="text-purple-500"
        />

      </div>

      <h3 className="text-2xl font-bold">
        Instant Delivery
      </h3>

      <p className="text-zinc-400 mt-4">
        Receive your products instantly after payment.
      </p>

    </div>

  </div>

  {/* Card 2 */}

  <div className="group bg-zinc-900/70 border border-purple-500/20 hover:border-purple-500 rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-3 overflow-hidden relative">

    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-b from-purple-500/10 to-transparent" />

    <div className="relative z-10">

      <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">

        <ShieldCheck
          size={38}
          className="text-purple-500"
        />

      </div>

      <h3 className="text-2xl font-bold">
        Secure Payment
      </h3>

      <p className="text-zinc-400 mt-4">
        Protected and trusted payment methods.
      </p>

    </div>

  </div>

  {/* Card 3 */}

  <div className="group bg-zinc-900/70 border border-purple-500/20 hover:border-purple-500 rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-3 overflow-hidden relative">

    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-b from-purple-500/10 to-transparent" />

    <div className="relative z-10">

      <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">

        <Gamepad2
          size={38}
          className="text-purple-500"
        />

      </div>

      <h3 className="text-2xl font-bold">
        Premium Services
      </h3>

      <p className="text-zinc-400 mt-4">
        Top quality subscriptions and digital services.
      </p>

    </div>

  </div>

  {/* Card 4 */}

  <div className="group bg-zinc-900/70 border border-purple-500/20 hover:border-purple-500 rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-3 overflow-hidden relative">

    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-b from-purple-500/10 to-transparent" />

    <div className="relative z-10">

      <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">

        <Star
          size={38}
          className="text-purple-500"
        />

      </div>

      <h3 className="text-2xl font-bold">
        Trusted Store
      </h3>

      <p className="text-zinc-400 mt-4">
        Hundreds of satisfied customers trust MJ Store.
      </p>

    </div>

  </div>

</div>
</section>

{/* Products */}

<section
  id="products"
  className="max-w-[1600px] mx-auto px-8 py-20"
>

  <h2 className="text-5xl font-black text-center mb-12">
    Products
  </h2>

   <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

    {products?.map((product: any) => (

      <Link
        href={`/product/${product.id}`}
        key={product.id}
      >

<div className="group relative overflow-hidden rounded-3xl border border-purple-500/20 bg-zinc-900 hover:border-purple-500 transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_0_40px_rgba(168,85,247,0.25)]">

  {/* Glow */}

  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-purple-500/10 blur-3xl transition duration-500" />
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-purple-500/5 pointer-events-none" />

  {/* Image */}

  <div className="relative h-52 flex items-center justify-center pt-8 bg-gradient-to-b from-purple-500/5 to-transparent">

  <img
    src={product.image}
    alt={product.name}
    className="w-36 h-36 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
  />

  <div className="absolute w-24 h-24 bg-purple-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition duration-500" />

</div>
  {/* Content */}

  <div className="absolute top-4 left-4 z-20">
    {(product.sales_count >= 500 || product.sales_count >= 100) && (
      <span className="px-3 py-1 rounded-full bg-purple-600 text-xs font-bold text-white">
        {product.sales_count >= 500 ? "Top Seller" : "Trending"}
      </span>
    )}
  </div>

{/* Content */}

<div className="p-6 border-t border-purple-500/20 flex flex-col min-h-[220px]">

  <h3 className="text-2xl font-black">
    {product.name}
  </h3>

  <p className="text-zinc-400 mt-2 text-sm">
    {product.description}
  </p>

  <div className="mt-5 space-y-2 text-sm text-zinc-300">
  {product.features?.split(",").map((feature: string) => (
  <div
  key={feature}
  className="flex items-center gap-2"
>
  <span className="text-green-400">✓</span>
  <span>{feature}</span>
</div>
))}
  </div>

 <div className="flex justify-between items-center mt-auto pt-6"> 

    <span className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
      {product.price} EGP
    </span>

    <div className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-xl font-bold transition">
      View →
    </div>

  </div>

</div>

</div>

      </Link>
    ))}

  </div>

</section>
<footer
  id="contact"
  className="border-t border-purple-500/10 mt-32"
>

  <div className="max-w-[1600px] mx-auto px-8 py-12">

    <div className="flex flex-col md:flex-row justify-between gap-10">

      <div>
        <h2 className="text-3xl font-black">
          MJ STORE
        </h2>

        <p className="text-zinc-500 mt-4 max-w-md">
          Premium digital subscriptions with
          instant delivery and secure payment.
        </p>
      </div>

      <div>
        <h3 className="font-bold mb-4">
          Quick Links
        </h3>

        <div className="flex flex-col gap-2 text-zinc-400">

          <a href="#products">Products</a>
          <a href="#reviews">Reviews</a>
          <a href="#contact">Contact</a>

        </div>
      </div>

    </div>

    <div className="border-t border-zinc-800 mt-10 pt-6 text-center text-zinc-500">
      © 2026 MJ STORE. All Rights Reserved.
    </div>

  </div>

</footer>
    </main>
  );
}