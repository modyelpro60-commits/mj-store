import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../lib/auth/requireAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // Admin-only
  await requireAdmin(req);

  try {
    const body = (await req.json()) as { id?: number };

    if (typeof body.id !== "number") {
      return NextResponse.json(
        { success: false, error: "Valid order id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", body.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
