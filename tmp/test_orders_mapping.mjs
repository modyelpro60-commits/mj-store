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

if (!url || !serviceRoleKey) throw new Error("Missing Supabase env vars");

const supabaseService = createClient(url, serviceRoleKey);

const { data: profileRows, error: profileError } = await supabaseService
  .from("profiles")
  .select("email,full_name")
  .limit(1);

if (profileError) {
  console.error("profiles query failed:", profileError);
  process.exit(1);
}

const profile = profileRows?.[0];
console.log("Sample profile:", profile);

const email = profile?.email ?? null;
const fullName = profile?.full_name ?? null;

async function run(label, query) {
  const { data, error } = await query;
  console.log(label, "error:", error ? error.message : null, "count:", data?.length ?? 0);
  if (data?.[0]) console.log(label, "sample row keys:", Object.keys(data[0]));
}

if (fullName) {
  await run("orders.eq(customer_name, full_name)", supabaseService.from("orders").select("*").eq("customer_name", fullName).limit(3));
  await run("orders.ilike(customer_name, %fullName%)", supabaseService.from("orders").select("*").ilike("customer_name", `%${fullName}%`).limit(3));
}

if (email) {
  await run("orders.ilike(customer_phone, %email%)", supabaseService.from("orders").select("*").ilike("customer_phone", `%${email}%`).limit(3));
  await run("orders.ilike(customer_name, %email%)", supabaseService.from("orders").select("*").ilike("customer_name", `%${email}%`).limit(3));
}

await run("orders.any (limit 1)", supabaseService.from("orders").select("*").limit(1));
