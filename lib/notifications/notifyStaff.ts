import { createClient } from "@supabase/supabase-js";
import { createNotification, type NotificationType } from "./createNotification";

const STAFF_ROLES = ["admin", "moderator", "helper"];

interface NotifyStaffInput {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  /** Optional: exclude one user (e.g. the sender themselves) */
  excludeUserId?: string;
}

/**
 * Creates a notification for every admin / moderator / helper.
 * Silently swallows all errors — never crashes the caller.
 */
export async function notifyAllStaff(input: NotifyStaffInput): Promise<void> {
  try {
    const svc = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: staffProfiles } = await svc
      .from("profiles")
      .select("id")
      .in("role", STAFF_ROLES);

    if (!staffProfiles?.length) return;

    await Promise.all(
      staffProfiles
        .filter((p) => !input.excludeUserId || (p.id as string) !== input.excludeUserId)
        .map((p) =>
          createNotification({
            userId:  p.id as string,
            type:    input.type,
            title:   input.title,
            message: input.message,
            link:    input.link,
          })
        )
    );
  } catch {
    // must never throw
  }
}
