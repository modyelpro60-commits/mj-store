import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/auth/requireAdmin";
import { createNotification } from "../../../../../lib/notifications/createNotification";

const ROLE_OPTIONS = ["user", "helper", "moderator", "admin"] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

const allowedTransition = (from: RoleOption, to: RoleOption): boolean => {
  if (from === to) return true;

  // Undirected edges based on spec:
  // User ↔ Helper
  // User ↔ Moderator
  // User ↔ Admin
  // Helper ↔ Moderator
  // Moderator ↔ Admin
  if ((from === "user" && to === "helper") || (from === "helper" && to === "user")) return true;
  if ((from === "user" && to === "moderator") || (from === "moderator" && to === "user")) return true;
  if ((from === "user" && to === "admin") || (from === "admin" && to === "user")) return true;
  if ((from === "helper" && to === "moderator") || (from === "moderator" && to === "helper")) return true;
  if ((from === "moderator" && to === "admin") || (from === "admin" && to === "moderator")) return true;

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

    // Admin protections
    if (targetUserId === admin.userId && nextRole !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admins cannot remove their own Admin role." },
        { status: 403 }
      );
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
    const currentRole = parseRole(currentRoleRaw);
    if (!currentRole) {
      return NextResponse.json(
        { success: false, error: "Target user has an invalid role in DB" },
        { status: 400 }
      );
    }

    if (!allowedTransition(currentRole, nextRole)) {
      return NextResponse.json(
        { success: false, error: `Role change ${currentRole} → ${nextRole} not allowed.` },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", targetUserId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // — Notification (additive) ————————————————————————————————————
    if (targetUserId !== admin.userId) {
      void createNotification({
        userId:  targetUserId,
        type:    "role_changed",
        title:   "Account Role Updated 🔑",
        message: `Your account role has been changed to "${nextRole}".`,
        link:    "/account",
      });
    }
    // ——————————————————————————————————————————————————————————————

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
