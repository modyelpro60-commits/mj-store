import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/auth/requireAdmin";
import { createNotification } from "../../../../../lib/notifications/createNotification";

const STATUS_OPTIONS = ["Active", "Suspended", "Banned"] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

function parseStatus(value: unknown): StatusOption | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return (STATUS_OPTIONS as readonly string[]).includes(normalized)
    ? (normalized as StatusOption)
    : null;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);

    const body = (await req.json()) as { userId?: string; status?: unknown };
    const targetUserId = body.userId?.trim();
    const nextStatus = parseStatus(body.status);

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }
    if (!nextStatus) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    // Admin protections:
    // Admin cannot suspend/ban themselves.
    if (targetUserId === admin.userId && nextStatus !== "Active") {
      return NextResponse.json(
        { success: false, error: "Admins cannot suspend/ban themselves." },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", targetUserId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // — Notification (additive) ————————————————————————————————————
    if (targetUserId !== admin.userId) {
      const statusMsg =
        nextStatus === "Active"    ? "Your account has been reactivated." :
        nextStatus === "Suspended" ? "Your account has been suspended. Contact support for help." :
                                     "Your account has been banned.";
      void createNotification({
        userId:  targetUserId,
        type:    "status_changed",
        title:   `Account Status: ${nextStatus}`,
        message: statusMsg,
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
