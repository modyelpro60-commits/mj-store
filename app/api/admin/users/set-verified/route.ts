import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/auth/requireAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { userId?: string; verified?: boolean };

  if (!body.userId || typeof body.verified !== "boolean") {
    return NextResponse.json(
      { success: false, error: "userId and verified (boolean) are required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ verified: body.verified })
    .eq("id", body.userId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
