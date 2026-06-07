import { supabase } from "../lib/supabase";
import { getHomeStats } from "./lib/home/getHomeStats";
import { normalizeProductFeatures } from "./lib/products/featureHelpers";
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
  features?: string | string[] | null;
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

  const productList = (products ?? []) as Product[];

  const productIds = productList.map((p) => p.id).filter(Boolean);

  const { data: featureRows } = productIds.length
    ? await supabase
        .from("product_features")
        .select("product_id,name,sort_order")
        .in("product_id", productIds)
    : { data: [] as any[] };

  const featureMap = new Map<string | number, any[]>();
  for (const row of (featureRows ?? []) as any[]) {
    const key = String(row.product_id);
    const curr = featureMap.get(key) ?? [];
    curr.push(row);
    featureMap.set(key, curr);
  }

  const list = productList.map((product) => {
    const rowsForProduct = featureMap.get(String(product.id)) ?? [];
    return {
      ...product,
      features: normalizeProductFeatures({
        ...product,
        product_features: rowsForProduct,
      } as any),
    };
  });

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
          totalProducts={productList.length}
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
