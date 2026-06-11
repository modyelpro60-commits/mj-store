import { createClient } from "@supabase/supabase-js";

export type HomeStats = {
  registeredUsers:  number;
  completedOrders:  number;
  /* kept for backward-compat with any existing consumer */
  activeCustomers:  number;
  totalCustomers:   number;
};

export async function getHomeStats(): Promise<HomeStats> {
  const fallback: HomeStats = {
    registeredUsers: 0,
    completedOrders: 0,
    activeCustomers: 0,
    totalCustomers:  0,
  };

  try {
    const url            = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) return fallback;

    const sb = createClient(url, serviceRoleKey);

    const [usersRes, ordersRes] = await Promise.all([
      /* registered users from the profiles table */
      sb.from("profiles").select("id", { count: "exact", head: true }),
      /* all orders (to count completed + unique customers) */
      sb.from("orders").select("customer_name, status"),
    ]);

    /* ── Registered users ── */
    const registeredUsers = usersRes.count ?? 0;

    /* ── Completed orders + unique customer names ── */
    let completedOrders = 0;
    const uniqueCustomers = new Set<string>();
    const activeCustomers  = new Set<string>();

    for (const row of (ordersRes.data ?? []) as Array<{ customer_name?: unknown; status?: unknown }>) {
      const name   = row.customer_name;
      const status = row.status;

      if (typeof name === "string" && name.trim()) {
        uniqueCustomers.add(name.trim());
        if (status !== "Cancelled") activeCustomers.add(name.trim());
      }

      const s = typeof status === "string" ? status.toLowerCase() : "";
      if (s === "completed") completedOrders++;
    }

    return {
      registeredUsers,
      completedOrders,
      activeCustomers: activeCustomers.size,
      totalCustomers:  uniqueCustomers.size,
    };
  } catch {
    return fallback;
  }
}
