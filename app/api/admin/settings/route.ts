import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "../../../lib/auth/requireAuthContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Only admins can change payment settings
export async function POST(req: Request) {
  try {
    await requireRole(req, ["admin"]);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as Record<string, string>;

    const rows = Object.entries(body)
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) => ({
        key,
        value: String(value ?? ""),
        updated_at: new Date().toISOString(),
      }));

    if (rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from("store_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
