import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireActiveUser } from "../../../lib/auth/requireAuthContext";

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
  const token = getBearerToken(req);

  // Unauthenticated: keep existing behavior (no hard denial here)
  if (!token) {
    return NextResponse.json({
      user: null,
      profile: null,
    });
  }

  try {
    // Server-side status enforcement (Suspended/Banned -> 403)
    const ctx = await requireActiveUser(req);

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("id, email, full_name, role, status, created_at")
      .eq("id", ctx.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        user: {
          id: ctx.userId,
          email: null,
        },
        profile: null,
      });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email ?? null,
      },
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        status: profile.status,
        created_at: profile.created_at,
      },
    });
  } catch (err) {
    // requireActiveUser throws a Response for forbidden cases
    if (err instanceof Response) return err;

    return NextResponse.json({
      user: null,
      profile: null,
    });
  }
}
