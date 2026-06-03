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

// Try common env locations (this environment is inconsistent)
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
if (!loaded) {
  const p = "mj-store/.env.local";
  loadEnv(p);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const supabaseService = createClient(url, serviceRoleKey);

// 1) Fetch a real profile email to reproduce the same filter
const { data: profileRows, error: profileError } = await supabaseService
  .from("profiles")
  .select("email")
  .limit(1);

if (profileError) {
  console.error("profiles query failed:", profileError);
  process.exit(2);
}

const email = profileRows?.[0]?.email ?? null;
console.log("Sample profile email:", email);

if (!email) {
  console.log("No profile email found; aborting orders query replication.");
  process.exit(0);
}

// 2) Orders query without created_at usage (to sanity check)
{
  const { data, error } = await supabaseService
    .from("orders")
    .select("*")
    .order("id", { ascending: false })
    .limit(5);

  console.log("orders select+order (no filters) error:", error ?? null);
  if (data?.length) console.log("orders sample keys:", Object.keys(data[0]));
}

// 3) Orders query exactly like /api/my-orders (by customer_email)
{
  const { data, error } = await supabaseService
    .from("orders")
    .select("*")
    .eq("customer_email", email)
    .order("id", { ascending: false })
    .limit(5);

  console.log("orders query eq(customer_email) error:", error ?? null);
  if (data?.length) console.log("orders filtered keys:", Object.keys(data[0]));
}
