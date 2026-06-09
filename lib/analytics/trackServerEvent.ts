import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function trackServerEvent(
  productId: string,
  eventType: "purchase" | "checkout_start",
  userId: string | null,
) {
  try {
    await supabase.from("product_events").insert({
      product_id: productId,
      user_id: userId,
      session_id: `server:${userId ?? "anon"}`,
      event_type: eventType,
    });
  } catch {
    // analytics must never crash the main flow
  }
}
