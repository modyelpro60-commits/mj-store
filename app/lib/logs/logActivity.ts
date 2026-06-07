import { createClient } from "@supabase/supabase-js";

/**
 * Records an audit-log entry (who did what). Soft-fails — never throws,
 * so it can be safely awaited inside API routes without breaking them.
 */
export type LogActivityInput = {
  actorId: string;
  action: string; // e.g. "product.create", "product.delete", "chat.close"
  targetType?: string | null; // e.g. "product", "chat_room"
  targetId?: string | number | null;
  targetLabel?: string | null; // human-readable: product name, customer name…
  actorName?: string | null; // optional override (avoids an extra lookup)
  actorRole?: string | null;
};

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let actorName = input.actorName ?? null;
    let actorRole = input.actorRole ?? null;

    // Resolve the actor's display name/role if not provided
    if (!actorName || !actorRole) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", input.actorId)
        .maybeSingle();
      if (prof) {
        actorName = actorName ?? ((prof.full_name as string) ?? null);
        actorRole = actorRole ?? ((prof.role as string) ?? null);
      }
    }

    await supabase.from("activity_logs").insert({
      action:       input.action,
      actor_id:     input.actorId,
      actor_name:   actorName,
      actor_role:   actorRole,
      target_type:  input.targetType ?? null,
      target_id:    input.targetId != null ? String(input.targetId) : null,
      target_label: input.targetLabel ?? null,
    });
  } catch (err) {
    console.warn(
      "[logActivity] failed:",
      err instanceof Error ? err.message : "unknown error"
    );
  }
}
