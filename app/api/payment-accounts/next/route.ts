import { NextResponse } from "next/server";
import { createClient }  from "@supabase/supabase-js";
import { requireActiveUser } from "../../../lib/auth/requireAuthContext";

/* ─── GET /api/payment-accounts/next?method=vodafone|instapay|usdt ──────────
 * Returns the next active account for the given payment method using
 * Round Robin selection (account with oldest last_used_at, NULL first).
 *
 * Does NOT update usage stats — that happens at order creation time.
 * Requires an active (non-banned, non-suspended) user session.
 * ─────────────────────────────────────────────────────────────────────────── */
const VALID = ["vodafone", "instapay", "usdt"] as const;

export async function GET(req: Request) {
  try {
    await requireActiveUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const method = searchParams.get("method") ?? "";

  if (!VALID.includes(method as (typeof VALID)[number])) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /* Round Robin: active accounts ordered by last_used_at ASC (NULL first) */
  const { data, error } = await supabase
    .from("payment_accounts")
    .select("id, method, name, value, qr_image, is_active, usage_count, last_used_at, created_at")
    .eq("method", method)
    .eq("is_active", true)
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "no_accounts" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
