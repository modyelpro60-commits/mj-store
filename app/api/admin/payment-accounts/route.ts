import { NextResponse } from "next/server";
import { createClient }  from "@supabase/supabase-js";
import { requireRole }   from "../../../lib/auth/requireAuthContext";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const VALID_METHODS = ["vodafone", "instapay", "usdt"] as const;

/* ─── GET /api/admin/payment-accounts?method=all|vodafone|instapay|usdt ─────
 * Returns all payment accounts, optionally filtered by method.
 * ─────────────────────────────────────────────────────────────────────────── */
export async function GET(req: Request) {
  try {
    await requireRole(req, ["admin", "moderator"]);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = svc();
  const { searchParams } = new URL(req.url);
  const method = searchParams.get("method") ?? "all";

  let query = supabase
    .from("payment_accounts")
    .select("*")
    .order("method")
    .order("created_at");

  if (method !== "all" && VALID_METHODS.includes(method as (typeof VALID_METHODS)[number])) {
    query = query.eq("method", method);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "no-store" },
  });
}

/* ─── POST /api/admin/payment-accounts ─────────────────────────────────────
 * Creates a new payment account.
 * Body: { method, name, value, qr_image?, is_active? }
 * ─────────────────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  try {
    await requireRole(req, ["admin"]);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const method    = typeof body.method    === "string" ? body.method.trim()    : "";
  const name      = typeof body.name      === "string" ? body.name.trim()      : "";
  const value     = typeof body.value     === "string" ? body.value.trim()     : "";
  const qr_image  = typeof body.qr_image  === "string" ? body.qr_image.trim()  : null;
  const is_active = body.is_active !== false;

  if (!VALID_METHODS.includes(method as (typeof VALID_METHODS)[number])) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }
  if (!value) {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  const supabase = svc();

  const { data, error } = await supabase
    .from("payment_accounts")
    .insert({ method, name, value, qr_image: qr_image || null, is_active })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, account: data });
}
