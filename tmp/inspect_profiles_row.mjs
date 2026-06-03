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
if (!loaded) {
  loadEnv("mj-store/.env.local");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const supabaseService = createClient(url, serviceRoleKey);

const { data, error } = await supabaseService
  .from("profiles")
  .select("*")
  .limit(1);

if (error) {
  console.error(JSON.stringify(error, null, 2));
  process.exit(2);
}

const row = (data && data[0]) || null;
if (!row) {
  console.log("No profiles rows found.");
  process.exit(0);
}

console.log(JSON.stringify({ keys: Object.keys(row), sampleRow: row }, null, 2));
