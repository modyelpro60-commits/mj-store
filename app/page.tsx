import { supabase } from "../lib/supabase";
import FeaturedProductsGrid from "../components/storefront/FeaturedProductsGrid";
import StorefrontHero from "../components/storefront/StorefrontHero";
import SocialProofSection from "../components/storefront/SocialProofSection";
import BestSellersSection from "../components/storefront/BestSellersSection";
import WhyChooseSection from "../components/storefront/WhyChooseSection";
import TestimonialsSection from "../components/storefront/TestimonialsSection";
import PremiumCTASection from "../components/storefront/PremiumCTASection";
import StorefrontNavbar from "../components/auth/StorefrontNavbar";

type Product = {
  id: number | string;
  name: string;
  description: string;
  price: number | string;
  image: string;
  features?: string | null;
  sales_count?: number | string | null;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function computeHomeStats(products: Product[]) {
  const delivered = products.reduce((acc, p) => acc + toNumber(p.sales_count), 0);
  const totalSalesEGP = products.reduce((acc, p) => {
    const sales = toNumber(p.sales_count);
    const price = toNumber(p.price);
    return acc + price * sales;
  }, 0);

  // We don’t have a dedicated customer table; approximate customers served with deliveries.
  const totalCustomers = delivered;

  return {
    totalDelivered: delivered,
    totalSalesEGP,
    totalCustomers,
  };
}

function computeBestSellers(products: Product[], limit: number) {
  return [...products]
    .sort((a, b) => toNumber(b.sales_count) - toNumber(a.sales_count))
    .slice(0, limit);
}

export default async function Home() {
  const { data: products } = await supabase.from("products").select("*");

  const list = (products ?? []) as Product[];
  const stats = computeHomeStats(list);
  const bestSellers = computeBestSellers(list, 8);

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* Nav */}
      <StorefrontNavbar />

      {/* Hero */}
      <StorefrontHero />

      {/* Social Proof */}
      <SocialProofSection stats={stats} />

      {/* Best Sellers */}
      <BestSellersSection id="best-sellers" products={bestSellers} />

      {/* Why Choose */}
      <WhyChooseSection />

      {/* Testimonials */}
      <TestimonialsSection id="reviews" />

      {/* Products */}
      <section id="products" className="max-w-[1600px] mx-auto px-8 py-20">
        <h2 className="text-5xl font-black text-center mb-12">Products</h2>
        <FeaturedProductsGrid products={list as any} />
      </section>

      {/* Premium CTA */}
      <PremiumCTASection />

      {/* Footer */}
      <footer id="contact" className="border-t border-purple-500/10 mt-0">
        <div className="max-w-[1600px] mx-auto px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div>
              <h2 className="text-3xl font-black">MJ STORE</h2>
              <p className="text-zinc-500 mt-4 max-w-md">
                Premium digital subscriptions with instant delivery and secure payment.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
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
