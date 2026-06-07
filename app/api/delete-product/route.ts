import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../lib/auth/requireAdmin";
import { logActivity } from "../../lib/logs/logActivity";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // Admin-only
  const admin = await requireAdmin(req);

  const { id } = await req.json();

  // Capture the product name before deleting (for the audit log)
  const { data: existing } = await supabase
    .from("products")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }

  await logActivity({
    actorId:     admin.userId,
    actorRole:   "admin",
    action:      "product.delete",
    targetType:  "product",
    targetId:    id,
    targetLabel: (existing?.name as string) ?? null,
  });

  return NextResponse.json({
    success: true,
  });
}
