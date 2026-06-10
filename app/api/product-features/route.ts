import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** GET /api/product-features?id=X → { success: true, features: string[] } */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ success: false, error: "missing or invalid id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("product_features")
    .select("name")
    .eq("product_id", Number(id))
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    features: (data ?? []).map((f: { name: string }) => f.name),
  });
}
