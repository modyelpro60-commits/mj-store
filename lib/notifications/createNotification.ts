import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS for server-side inserts
const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type NotificationType =
  | "order_approved"
  | "order_rejected"
  | "new_message"
  | "review_reply"
  | "support_reply"
  | "role_changed"
  | "status_changed"
  // order flow v2
  | "new_order"
  | "payment_confirmed"
  | "payment_rejected"
  | "order_delivered"
  // account milestones
  | "account_verified";

interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Creates a notification row.
 * Silently swallows all errors — must NEVER throw and crash the caller.
 */
export async function createNotification(input: NotificationInput): Promise<void> {
  try {
    await svc.from("notifications").insert({
      user_id: input.userId,
      type:    input.type,
      title:   input.title,
      message: input.message,
      link:    input.link ?? null,
      is_read: false,
    });
  } catch {
    // analytics / notifications must never crash the main business flow
  }
}
