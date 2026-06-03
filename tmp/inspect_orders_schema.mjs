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

const envPath = path.resolve(__dirname, "../d:/my python/mj-store/.env.local").replace(/\\/g, "/");
// The workspace path is inconsistent across environments; try common paths.
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
  // Fallback: try hard-coded repo path from current working dir
  const p = "mj-store/.env.local";
  loadEnv(p);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  console.error("Missing Supabase env vars. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabaseService = createClient(url, serviceRoleKey);

const { data, error } = await supabaseService
  .from("orders")
  .select("*")
  .limit(1);

if (error) {
  console.error(JSON.stringify(error, null, 2));
  process.exit(2);
}

const row = (data && data[0]) || null;
if (!row) {
  console.log("No orders rows found (table empty).");
  process.exit(0);
}

const keys = Object.keys(row);
const candidates = keys.filter((k) => {
  const lower = k.toLowerCase();
  return (lower.includes("created") || lower.includes("date") || lower.includes("time")) && (lower.includes("at") || lower.includes("on") || lower.includes("date") || lower.includes("time") || lower.includes("timestamp"));
});

console.log(JSON.stringify({ keys, candidates, sampleRow: row }, null, 2));
