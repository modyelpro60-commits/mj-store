import { supabase } from "../lib/supabase";
import { getHomeStats } from "./lib/home/getHomeStats";
import FeaturedProductsGrid from "../components/storefront/FeaturedProductsGrid";
import StorefrontHero from "../components/storefront/StorefrontHero";
import CommandBar from "../components/nav/CommandBar";
import HomeFeaturedProductsHeading from "../components/storefront/HomeFeaturedProductsHeading";
import HomeFooter from "../components/storefront/HomeFooter";
import HomeLiveStats from "../components/storefront/home/HomeLiveStats";
import HomeHowItWorks from "../components/storefront/HomeHowItWorks";
import HomeProductsSection from "../components/storefront/HomeProductsSection";
import HomeTrustSection from "../components/storefront/HomeTrustSection";
import PageAmbient from "../components/storefront/PageAmbient";

// Actual DB schema: id, name, description, image, price, sales_count, category,
//   badge, features, full_description, is_active, created_at
// Migration-added: original_price NUMERIC NULL, short_description TEXT NULL
type Product = {
  id: number | string;
  name: string;
  description: string;
  short_description?: string | null;
  price: number | string;
  original_price?: number | string | null;
  image: string;
  features?: string | string[] | null;
  sales_count?: number | string | null;
  is_active?: boolean;
  category?: string | null;
  badge?: string | null;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export default async function Home() {
  /* ── Parallel fetches ── */
  const [{ data: products }, stats] = await Promise.all([
    supabase.from("products").select("*"),
    getHomeStats(),
  ]);

  const list = (products ?? []) as Product[];

  /* ── Featured = best-selling active product ── */
  const { data: orderData } = await supabase
    .from("orders")
    .select("product_id")
    .eq("status", "completed")
    .order("product_id");

  let featuredProduct: Product | null = null;

  if (orderData && orderData.length > 0) {
    const salesMap = new Map<string | number, number>();
    orderData.forEach((o) => salesMap.set(o.product_id, (salesMap.get(o.product_id) || 0) + 1));

    let maxSales = 0;
    for (const p of list) {
      if (p.is_active === false) continue;
      const sales = salesMap.get(p.id) || 0;
      if (sales > maxSales) { maxSales = sales; featuredProduct = p; }
    }
  }

  if (!featuredProduct) {
    const sorted = [...list]
      .filter((p) => p.is_active !== false)
      .sort((a, b) => toNumber(b.sales_count) - toNumber(a.sales_count));
    featuredProduct = sorted[0] || null;
  }

  const featured        = featuredProduct ? [featuredProduct] : [];
  const activeProducts  = list.filter((p) => p.is_active !== false);

  return (
    <>
      <CommandBar />

      <main className="relative min-h-screen bg-void-base">
        <PageAmbient />

        {/* ── Hero ── */}
        <StorefrontHero />

        {/* ── Stats ── */}
        <HomeLiveStats
          registeredUsers={stats.registeredUsers}
          completedOrders={stats.completedOrders}
          totalProducts={activeProducts.length}
        />

        {/* ── How It Works ── */}
        <HomeHowItWorks />

        {/* ── Featured / Best Seller ── */}
        {featured.length > 0 && (
          <section id="best-sellers" className="max-w-[1600px] mx-auto px-8 pt-4 pb-12">
            <HomeFeaturedProductsHeading />
            <FeaturedProductsGrid products={featured} variant="featured" />
          </section>
        )}

        {/* ── All Products (with category filter) ── */}
        <HomeProductsSection products={list} />

        {/* ── Trust Section ── */}
        <HomeTrustSection />

        {/* ── Footer ── */}
        <HomeFooter />
      </main>
    </>
  );
}
