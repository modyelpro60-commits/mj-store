import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/auth/requireAdmin";
import { createNotification } from "../../../../../lib/notifications/createNotification";

const ROLE_OPTIONS = ["user", "helper", "moderator", "admin", "owner"] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

// Role hierarchy: higher index = higher privilege
const ROLE_RANK: Record<RoleOption, number> = {
  user: 0,
  helper: 1,
  moderator: 2,
  admin: 3,
  owner: 4,
};

const allowedTransition = (from: RoleOption, to: RoleOption): boolean => {
  if (from === to) return true;

  // Standard transitions (undirected edges, same as before)
  if ((from === "user" && to === "helper") || (from === "helper" && to === "user")) return true;
  if ((from === "user" && to === "moderator") || (from === "moderator" && to === "user")) return true;
  if ((from === "user" && to === "admin") || (from === "admin" && to === "user")) return true;
  if ((from === "helper" && to === "moderator") || (from === "moderator" && to === "helper")) return true;
  if ((from === "moderator" && to === "admin") || (from === "admin" && to === "moderator")) return true;

  // Owner transitions: must pass the owner-only check in the main handler first.
  // Any role can be assigned owner (if the caller is owner), and any role can be downgraded.
  if (to === "owner") return true;
  if (from === "owner") return true;

  return false;
};

function parseRole(value: unknown): RoleOption | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return (ROLE_OPTIONS as readonly string[]).includes(normalized) ? (normalized as RoleOption) : null;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);

    const body = (await req.json()) as { userId?: string; role?: unknown };
    const targetUserId = body.userId?.trim();
    const nextRole = parseRole(body.role);

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }
    if (!nextRole) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", targetUserId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { success: false, error: targetError?.message || "User not found" },
        { status: 404 }
      );
    }

    const currentRoleRaw = targetProfile.role;
    const currentRole = parseRole(currentRoleRaw) ?? "user";

    // ── Security rules ──────────────────────────────────────────────────────

    // 1. Only owner can assign or remove the "owner" role
    if (nextRole === "owner" && admin.role !== "owner") {
      return NextResponse.json(
        { success: false, error: "Only an Owner can assign the Owner role." },
        { status: 403 }
      );
    }
    if (currentRole === "owner" && admin.role !== "owner") {
      return NextResponse.json(
        { success: false, error: "Only an Owner can change another Owner's role." },
        { status: 403 }
      );
    }

    // 2. Owner cannot remove their own owner role
    if (targetUserId === admin.userId && admin.role === "owner" && nextRole !== "owner") {
      return NextResponse.json(
        { success: false, error: "Owners cannot remove their own Owner role." },
        { status: 403 }
      );
    }

    // 3. Admin (non-owner) cannot remove their own admin role
    if (targetUserId === admin.userId && admin.role === "admin" && nextRole !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admins cannot remove their own Admin role." },
        { status: 403 }
      );
    }

    // 4. Transition must be valid
    if (!allowedTransition(currentRole, nextRole)) {
      return NextResponse.json(
        { success: false, error: `Role change ${currentRole} → ${nextRole} not allowed.` },
        { status: 403 }
      );
    }

    // ── Apply update ─────────────────────────────────────────────────────────

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", targetUserId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // ── Notification (additive) ──────────────────────────────────────────────
    if (targetUserId !== admin.userId) {
      void createNotification({
        userId:  targetUserId,
        type:    "role_changed",
        title:   "Account Role Updated 🔑",
        message: `Your account role has been changed to "${nextRole}".`,
        link:    "/account",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
