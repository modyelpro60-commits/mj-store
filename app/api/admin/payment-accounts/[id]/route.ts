import { NextResponse } from "next/server";
import { createClient }  from "@supabase/supabase-js";
import { requireRole }   from "../../../../lib/auth/requireAuthContext";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/* ─── PATCH /api/admin/payment-accounts/[id] ────────────────────────────────
 * Partial update — any subset of: name, value, qr_image, is_active
 * ─────────────────────────────────────────────────────────────────────────── */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["admin"]);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if (typeof body.name      === "string")  updates.name      = body.name.trim();
  if (typeof body.value     === "string")  updates.value     = body.value.trim();
  if (typeof body.qr_image  === "string")  updates.qr_image  = body.qr_image.trim() || null;
  if (body.qr_image         === null)      updates.qr_image  = null;
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = svc();

  const { data, error } = await supabase
    .from("payment_accounts")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, account: data });
}

/* ─── DELETE /api/admin/payment-accounts/[id] ───────────────────────────────
 * Hard delete. Orders that reference this account will have the FK set to NULL
 * (the snapshot remains intact — orders are never affected functionally).
 * ─────────────────────────────────────────────────────────────────────────── */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["admin"]);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = svc();

  const { error } = await supabase
    .from("payment_accounts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
