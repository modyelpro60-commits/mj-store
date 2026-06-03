import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/auth/requireAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ProductRow {
  id: number;
  name: string;
}

interface OrderRow {
  id: number;
  product_id: number | null;
  product_name: string | null;
  price: number | string | null;
}

interface DashboardStatsResponse {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  bestSellingProduct: {
    id: number | null;
    name: string;
    sales: number;
  } | null;
}

export async function GET(req: Request) {
  // Admin-only
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("id, name"),
      supabase
        .from("orders")
        .select("id, product_id, product_name, price"),
    ]);

    const { data: products, error: productsError } = productsRes;
    const { data: orders, error: ordersError } = ordersRes;

    if (productsError) {
      return NextResponse.json(
        { success: false, error: productsError.message },
        { status: 500 }
      );
    }

    if (ordersError) {
      return NextResponse.json(
        { success: false, error: ordersError.message },
        { status: 500 }
      );
    }

    const typedProducts = (products ?? []) as ProductRow[];
    const typedOrders = (orders ?? []) as OrderRow[];

    const totalRevenue = typedOrders.reduce((sum, order) => {
      const value =
        typeof order.price === "string" ? Number(order.price) : order.price ?? 0;
      return sum + value;
    }, 0);

    const salesMap = new Map<
      number | string,
      { name: string; sales: number; id: number | null }
    >();

    for (const order of typedOrders) {
      const key = order.product_id ?? order.product_name ?? order.id;
      const name = order.product_name ?? "Unknown Product";
      const existing = salesMap.get(key);

      if (existing) {
        existing.sales += 1;
      } else {
        salesMap.set(key, {
          name,
          sales: 1,
          id: order.product_id,
        });
      }
    }

    let bestSellingProduct: DashboardStatsResponse["bestSellingProduct"] = null;

    for (const value of salesMap.values()) {
      if (!bestSellingProduct || value.sales > bestSellingProduct.sales) {
        bestSellingProduct = value;
      }
    }

    const response: DashboardStatsResponse = {
      totalProducts: typedProducts.length,
      totalOrders: typedOrders.length,
      totalRevenue,
      bestSellingProduct,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
