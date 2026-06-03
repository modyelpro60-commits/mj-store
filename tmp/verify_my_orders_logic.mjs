import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv(envPath) {
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!key) continue;
    process.env[key] = value;
  }
}

// Load .env.local (repo-local paths can vary in this environment)
const candidatePaths = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "mj-store/.env.local"),
  path.resolve("mj-store/.env.local"),
  path.resolve("../mj-store/.env.local"),
].filter(Boolean);

let loaded = false;
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    loadEnv(p);
    loaded = true;
    break;
  }
}
if (!loaded) loadEnv("mj-store/.env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const supabaseService = createClient(url, serviceRoleKey);

const { data: profileRows, error: profileError } = await supabaseService
  .from("profiles")
  .select("id,email,full_name")
  .limit(1);

if (profileError) {
  console.error("profiles query failed:", profileError);
  process.exit(2);
}

const profile = profileRows?.[0] ?? null;
if (!profile) {
  console.log("No profile rows found.");
  process.exit(0);
}

const customerName = profile.full_name;
console.log("Profile:", { id: profile.id, email: profile.email, full_name: profile.full_name });

if (!customerName) {
  console.log("No full_name for profile, would return empty orders payload.");
  process.exit(0);
}

// Recent orders
const { data: recentData, error: recentError } = await supabaseService
  .from("orders")
  .select("*")
  .eq("customer_name", customerName)
  .order("id", { ascending: false })
  .limit(5);

if (recentError) {
  console.error("recent orders query failed:", recentError);
  process.exit(3);
}

const recentOrders = (recentData ?? []).map((o) => ({
  id: o.id,
  product_name: o.product_name,
  status: o.status,
  price: o.price,
}));

// Counts
const [{ count: totalCount }, { count: completedCount }, { count: pendingCount }] =
  await Promise.all([
    supabaseService.from("orders").select("id", { count: "exact", head: true }).eq("customer_name", customerName),
    supabaseService
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_name", customerName)
      .eq("status", "Completed"),
    supabaseService
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_name", customerName)
      .eq("status", "Pending"),
  ]);

console.log("Counts:", {
  totalOrders: Number(totalCount ?? 0),
  completedOrders: Number(completedCount ?? 0),
  pendingOrders: Number(pendingCount ?? 0),
});

console.log("RecentOrders:", recentOrders);
