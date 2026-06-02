import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;

  const parts = auth.trim().split(" ");
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return null;

  return token || null;
}

export async function GET(req: Request) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json({
        user: null,
        profile: null,
      });
    }

    // Fetch auth user with anon key + provided access token
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);

    if (userError || !userData?.user) {
      return NextResponse.json({
        user: null,
        profile: null,
      });
    }

    // Read profile role via service role (deterministic server-side lookup)
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = userData.user.id;

    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        user: {
          id: userData.user.id,
          email: userData.user.email ?? null,
        },
        profile: null,
      });
    }

    return NextResponse.json({
      user: {
        id: userData.user.id,
        email: userData.user.email ?? null,
      },
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        created_at: profile.created_at,
      },
    });
  } catch {
    return NextResponse.json({
      user: null,
      profile: null,
    });
  }
}
