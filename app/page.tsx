import { supabase } from "../lib/supabase";
import { getHomeStats } from "./lib/home/getHomeStats";
import FeaturedProductsGrid from "../components/storefront/FeaturedProductsGrid";
import StorefrontHero from "../components/storefront/StorefrontHero";
import CommandBar from "../components/nav/CommandBar";
import HomeProductsHeading from "../components/storefront/HomeProductsHeading";
import HomeFooter from "../components/storefront/HomeFooter";
import HomeFeaturedProductsHeading from "../components/storefront/HomeFeaturedProductsHeading";
import HomeLiveStats from "../components/storefront/home/HomeLiveStats";
import PageAmbient from "../components/storefront/PageAmbient";

type Product = {
  id: number | string;
  name: string;
  description: string;
  price: number | string;
  image: string;
  original_price?: number | string | null;
  status?: string;
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

export default async function Home() {
  const [{ data: products }, stats] = await Promise.all([
    supabase.from("products").select("*"),
    getHomeStats(),
  ]);

  const list = (products ?? []) as Product[];

  // Fetch best-selling product from completed orders
  const { data: orderData } = await supabase
    .from("orders")
    .select("product_id")
    .eq("status", "completed")
    .order("product_id");

  let featuredProduct: Product | null = null;

  if (orderData && orderData.length > 0) {
    const salesCount = new Map<string | number, number>();
    orderData.forEach(order => {
      const id = order.product_id;
      salesCount.set(id, (salesCount.get(id) || 0) + 1);
    });

    let maxSales = 0;
    for (const product of list) {
      const sales = salesCount.get(product.id) || 0;
      if (sales > maxSales) {
        maxSales = sales;
        featuredProduct = product;
      }
    }
  }

  if (!featuredProduct) {
    const sorted = [...list].sort((a, b) => toNumber(b.sales_count) - toNumber(a.sales_count));
    featuredProduct = sorted[0] || null;
  }

  const featured = featuredProduct ? [featuredProduct] : [];

  return (
    <>
      {/* Navbar rendered OUTSIDE <main> to prevent any parent containment issues */}
      <CommandBar />

      <main className="relative min-h-screen bg-void-base">
        <PageAmbient />
        {/* Hero */}
        <StorefrontHero />

        {/* Stats directly below CTA — compact pills */}
        <HomeLiveStats
          activeCustomers={stats.activeCustomers}
          totalCustomers={stats.totalCustomers}
          totalProducts={list.length}
        />

        {/* Featured Products — compact spacing */}
        <section id="best-sellers" className="max-w-[1600px] mx-auto px-8 pt-4 pb-12">
          <HomeFeaturedProductsHeading />
          <FeaturedProductsGrid products={featured as any} variant="featured" />
        </section>

        {/* Products Grid */}
        <section id="products" className="max-w-[1600px] mx-auto px-8 pb-28">
          <HomeProductsHeading />
          <FeaturedProductsGrid products={list as any} variant="all" />
        </section>

        <HomeFooter />
      </main>
    </>
  );
}
