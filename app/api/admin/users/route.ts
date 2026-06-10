import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/auth/requireAdmin";

const ROLE_OPTIONS = ["user", "helper", "moderator", "admin"] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

const STATUS_OPTIONS = ["Active", "Suspended", "Banned"] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

type RoleValue = RoleOption | "All";
type StatusValue = StatusOption | "All";

type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: RoleOption;
  status: StatusOption;
  created_at: string | null;
  orders_count: number;
  verified: boolean;
};

type UsersResponse = {
  success: boolean;
  data?: AdminUserRow[];
  error?: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function toRole(value: string | null): RoleOption | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!ROLE_OPTIONS.includes(normalized as RoleOption)) return null;
  return normalized as RoleOption;
}

function toStatus(value: string | null): StatusOption | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!STATUS_OPTIONS.includes(normalized as StatusOption)) return null;
  return normalized as StatusOption;
}

// DB currently stores legacy role "customer". Map it to UI/API "user".
function mapRoleFromDb(dbRole: string | null): RoleOption {
  if (!dbRole) return "user";
  const normalized = dbRole.trim().toLowerCase();

  if (normalized === "customer") return "user";
  if (ROLE_OPTIONS.includes(normalized as RoleOption)) return normalized as RoleOption;

  return "user";
}

function mapRoleToDb(role: RoleOption): string {
  // Legacy DB uses "customer" for user role.
  if (role === "user") return "customer";
  return role;
}

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const roleParam = searchParams.get("role")?.trim() ?? "All";
    const statusParam = searchParams.get("status")?.trim() ?? "All";
    const limitParam = Number(searchParams.get("limit") ?? "20");

    const roleValue: RoleValue = roleParam === "All" ? "All" : (roleParam as RoleOption);
    const statusValue: StatusValue = statusParam === "All" ? "All" : (statusParam as StatusOption);

    const limit =
      Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 100 ? limitParam : 20;

    const roleFilter = roleValue === "All" ? null : toRole(roleValue);
    const statusFilter = statusValue === "All" ? null : toStatus(statusValue);

    let query = supabase
      .from("profiles")
      .select("id, email, full_name, role, status, created_at, verified")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (roleFilter) {
      query = query.eq("role", mapRoleToDb(roleFilter));
    }

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: profiles, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } satisfies UsersResponse,
        { status: 500 }
      );
    }

    const typedProfiles = (profiles ?? []) as Array<{
      id: string;
      email: string | null;
      full_name: string | null;
      role: string | null;
      status: StatusOption;
      created_at: string | null;
      verified: boolean | null;
    }>;

    const users: AdminUserRow[] = [];

    // Orders table stores customer_name, which is matched in /api/my-orders using profiles.full_name.
    for (const p of typedProfiles) {
      const fullName = p.full_name ?? null;

      let ordersCount = 0;
      if (fullName) {
        const { count, error: countError } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("customer_name", fullName);

        if (!countError) ordersCount = Number(count ?? 0);
      }

      users.push({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role: mapRoleFromDb(p.role ?? null),
        status: p.status,
        created_at: p.created_at,
        orders_count: ordersCount,
        verified: p.verified ?? false,
      });
    }

    return NextResponse.json({ success: true, data: users } satisfies UsersResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message } satisfies UsersResponse, { status: 500 });
  }
}
