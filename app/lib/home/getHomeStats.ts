import { createClient } from "@supabase/supabase-js";

export type HomeStats = {
  activeCustomers: number;
  totalCustomers: number;
};

const ORDER_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export async function getHomeStats(): Promise<HomeStats> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return { activeCustomers: 0, totalCustomers: 0 };
    }

    const supabaseService = createClient(url, serviceRoleKey);

    const { data, error } = await supabaseService
      .from("orders")
      .select("customer_name,status");

    if (error) {
      return { activeCustomers: 0, totalCustomers: 0 };
    }

    const totalCustomers = new Set<string>();
    const activeCustomers = new Set<string>();

    for (const row of (data ?? []) as Array<{ customer_name?: unknown; status?: unknown }>) {
      const name = row.customer_name;
      if (!isNonEmptyString(name)) continue;

      totalCustomers.add(name);

      const statusRaw = row.status;
      // If status is missing/unknown, treat as active (unless explicitly Cancelled).
      if (isOrderStatus(statusRaw) && statusRaw === "Cancelled") continue;

      activeCustomers.add(name);
    }

    return {
      activeCustomers: activeCustomers.size,
      totalCustomers: totalCustomers.size,
    };
  } catch {
    return { activeCustomers: 0, totalCustomers: 0 };
  }
}
