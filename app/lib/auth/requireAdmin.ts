import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AdminAuthResult = {
  userId: string;
  role: "admin";
};

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;

  const parts = auth.trim().split(" ");
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return null;

  return token || null;
}

export async function requireAdmin(req: Request): Promise<AdminAuthResult> {
  const token = getBearerToken(req);

  if (!token) {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: userData, error: userError } = await supabaseAnon.auth.getUser(
    token
  );

  if (userError || !userData?.user) {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = userData.user.id;

  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile, error: profileError } = await supabaseService
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId, role: "admin" };
}
