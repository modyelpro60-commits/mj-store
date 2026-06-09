import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../../../../lib/auth/requireAuthContext";

const STAFF_ROLES: UserRole[] = ["admin", "moderator", "helper"];

/* ─── POST /api/chat/rooms/[roomId]/confirm-payment ──────────────────────────
 * Staff confirm a manual payment for the room's order → orders become
 * "Processing" and a confirmation message is posted in the chat.
 * ─────────────────────────────────────────────────────────────────────────── */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  let ctx;
  try {
    ctx = await requireRole(req, STAFF_ROLES);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, order_ref")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
  }
  if (!room.order_ref) {
    return NextResponse.json({ success: false, error: "هذه ليست محادثة طلب" }, { status: 400 });
  }

  const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", ctx.userId).maybeSingle();
  const staffName = (prof?.full_name as string) ?? "الإدارة";
  const now = new Date().toISOString();

  // Mark all the order's rows as paid → Processing
  await supabase
    .from("orders")
    .update({ status: "Processing", handled_by: ctx.userId, handled_by_name: staffName, handled_at: now })
    .eq("order_ref", room.order_ref);

  // Confirmation message in the chat
  await supabase.from("chat_messages").insert({
    room_id: roomId,
    sender_id: null,
    is_system: true,
    body: `✅ تم الدفع بنجاح!\nسوف يتم تسليم الطلب خلال 5 دقائق إلى 24 ساعة. تابع الشات.\n(طلب #${room.order_ref})`,
  });

  await supabase
    .from("chat_rooms")
    .update({ last_message_at: now, last_sender_is_staff: true })
    .eq("id", roomId);

  return NextResponse.json({ success: true });
}
