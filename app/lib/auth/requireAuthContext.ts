import { createClient } from "@supabase/supabase-js";

export type UserRole = "user" | "helper" | "moderator" | "admin";
export type UserStatus = "Active" | "Suspended" | "Banned";

export type AuthContext = {
  userId: string;
  role: UserRole;
  status: UserStatus;
};

const ROLE_OPTIONS: UserRole[] = ["user", "helper", "moderator", "admin"];
const STATUS_OPTIONS: UserStatus[] = ["Active", "Suspended", "Banned"];

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;

  const parts = auth.trim().split(" ");
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return null;

  return token || null;
}

function normalizeRole(value: unknown): UserRole {
  if (typeof value !== "string") return "user";
  const normalized = value.trim().toLowerCase();

  // Legacy values
  if (normalized === "customer") return "user";
  if (normalized === "member") return "user";

  if (ROLE_OPTIONS.includes(normalized as UserRole)) return normalized as UserRole;
  return "user";
}

function normalizeStatus(value: unknown): UserStatus {
  if (typeof value !== "string") return "Active";
  const normalized = value.trim();
  if (STATUS_OPTIONS.includes(normalized as UserStatus)) return normalized as UserStatus;
  return "Active";
}

function forbiddenResponse(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

export async function getAuthContext(req: Request): Promise<AuthContext> {
  const token = getBearerToken(req);

  if (!token) {
    throw forbiddenResponse("Unauthorized");
  }

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);

  if (userError || !userData?.user) {
    throw forbiddenResponse("Unauthorized");
  }

  const userId = userData.user.id;

  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile, error: profileError } = await supabaseService
    .from("profiles")
    .select("id, role, status")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw forbiddenResponse("Unauthorized");
  }

  return {
    userId,
    role: normalizeRole(profile.role),
    status: normalizeStatus(profile.status),
  };
}

export async function requireActiveUser(req: Request, allowedRoles?: UserRole[]) {
  const ctx = await getAuthContext(req);

  if (ctx.status === "Suspended") throw forbiddenResponse("Account Suspended");
  if (ctx.status === "Banned") throw forbiddenResponse("Account Banned");

  if (allowedRoles && !allowedRoles.includes(ctx.role)) {
    throw forbiddenResponse("Forbidden");
  }

  return ctx;
}

export async function requireRole(
  req: Request,
  allowedRoles: UserRole[]
) {
  return requireActiveUser(req, allowedRoles);
}
