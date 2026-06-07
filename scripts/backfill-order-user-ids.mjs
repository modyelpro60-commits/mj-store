/**
 * scripts/backfill-order-user-ids.mjs
 *
 * One-time migration: populate orders.user_id for legacy rows where it is NULL.
 *
 * Prerequisites
 * ─────────────
 * Run the SQL migration first:
 *   supabase/migrations/20260607_orders_add_user_id.sql
 *
 * This script will abort with a clear error if user_id column does not exist.
 *
 * Strategy
 * ─────────
 * 1. Verify orders.user_id column exists (pre-flight).
 * 2. Fetch every profile that has a full_name.
 * 3. Build a lookup map:  normalised(full_name) → profile row(s)
 * 4. Fetch all orders where user_id IS NULL.
 * 5. For each order, normalise customer_name and look it up in the map.
 *    - Exactly one match  → queue for UPDATE
 *    - Zero or >1 matches → skip, report reason
 * 6. Apply UPDATEs (with a secondary .is("user_id", null) guard).
 * 7. Print full summary.
 *
 * Safety guarantees
 * ─────────────────
 * • Never overwrites an order that already has user_id set.
 * • Skips ambiguous names (two users share the same full_name).
 * • Skips orders with a blank customer_name.
 * • Dry-run mode by default — no DB writes until DRY_RUN=false.
 * • Reads .env.local automatically — no extra deps required.
 *
 * Usage
 * ─────
 *   node scripts/backfill-order-user-ids.mjs              # dry run
 *   DRY_RUN=false node scripts/backfill-order-user-ids.mjs    # commit
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

/* ─── load .env.local (no dotenv dependency needed) ───────────────────── */
const __dir   = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env.local");

function loadEnv(path) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {
    console.warn(`⚠️  Could not read ${path} — falling back to existing env vars.\n`);
  }
}

loadEnv(envPath);

/* ─── config ───────────────────────────────────────────────────────────── */
const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN          = process.env.DRY_RUN !== "false"; // default: true

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("    Make sure .env.local exists and contains both values.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* ─── helpers ──────────────────────────────────────────────────────────── */
/** Lowercase + collapse whitespace for safe fuzzy comparison */
function normalise(str) {
  return (str ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function hr(char = "─", width = 62) {
  return char.repeat(width);
}

/* ─── pre-flight: verify the column exists ─────────────────────────────── */
async function assertColumnExists() {
  // PostgREST doesn't expose information_schema directly, so we probe by
  // selecting user_id from a single row. If the column is missing, PostgREST
  // returns a 400/PGRST204 error we can detect.
  const { error } = await supabase
    .from("orders")
    .select("user_id")
    .limit(1);

  if (error) {
    if (
      error.message.includes("user_id") ||
      error.message.toLowerCase().includes("column") ||
      error.code === "42703"   // undefined_column in PostgreSQL
    ) {
      console.error(hr("═"));
      console.error("❌  Column orders.user_id does not exist.");
      console.error();
      console.error("   Run the SQL migration first:");
      console.error("   supabase/migrations/20260607_orders_add_user_id.sql");
      console.error();
      console.error("   Via Supabase CLI:");
      console.error("     supabase db push");
      console.error();
      console.error("   Or paste the SQL into the Supabase Dashboard SQL editor.");
      console.error(hr("═"));
      process.exit(1);
    }
    // Other errors (empty table, RLS, etc.) are non-fatal for this check
    console.warn(`⚠️  Pre-flight probe returned: ${error.message} — continuing anyway.\n`);
  }
}

/* ─── main ─────────────────────────────────────────────────────────────── */
async function run() {
  console.log(hr("═"));
  console.log("  MJ Store — orders.user_id backfill");
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN — no changes will be written" : "⚡ LIVE — changes will be committed"}`);
  console.log(hr("═"));
  console.log();

  /* ── pre-flight ── */
  console.log("🔍  Pre-flight: checking orders.user_id column…");
  await assertColumnExists();
  console.log("    ✅  Column exists.\n");

  /* ── load profiles ── */
  console.log("📋  Loading profiles with full_name…");
  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .not("full_name", "is", null);

  if (profilesErr) {
    console.error("❌  Failed to load profiles:", profilesErr.message);
    process.exit(1);
  }
  console.log(`    Found ${profiles.length} profile(s) with a full_name.\n`);

  /* ── build name → profile[] map ── */
  /** @type {Map<string, Array<{id:string,full_name:string,email:string}>>} */
  const nameMap = new Map();

  for (const p of profiles) {
    const key = normalise(p.full_name);
    if (!key) continue;
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key).push(p);
  }

  /* report ambiguous names */
  const ambiguous = [...nameMap.entries()].filter(([, u]) => u.length > 1);
  if (ambiguous.length) {
    console.warn(`⚠️  ${ambiguous.length} name(s) shared by multiple profiles (will be skipped):`);
    for (const [name, users] of ambiguous) {
      console.warn(`    "${name}"  →  ${users.map((u) => u.id).join(", ")}`);
    }
    console.warn();
  }

  /* ── load orders with user_id IS NULL ── */
  console.log("🛒  Loading orders with user_id IS NULL…");
  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select("id, customer_name, status, price, created_at")
    .is("user_id", null)
    .order("id", { ascending: true });

  if (ordersErr) {
    console.error("❌  Failed to load orders:", ordersErr.message);
    process.exit(1);
  }
  console.log(`    Found ${orders.length} order(s) with NULL user_id.\n`);

  if (orders.length === 0) {
    console.log("✅  Nothing to migrate. All orders already have user_id set.");
    return;
  }

  /* ── classify each order ── */
  const toUpdate = []; // { orderId, userId, customerName, profile }
  const skipped  = []; // { orderId, customerName, reason }

  for (const order of orders) {
    const key = normalise(order.customer_name);

    if (!key) {
      skipped.push({ orderId: order.id, customerName: order.customer_name ?? "", reason: "blank customer_name" });
      continue;
    }

    const matches = nameMap.get(key) ?? [];

    if (matches.length === 0) {
      skipped.push({ orderId: order.id, customerName: order.customer_name, reason: "no profile matches name" });
      continue;
    }

    if (matches.length > 1) {
      skipped.push({
        orderId: order.id,
        customerName: order.customer_name,
        reason: `ambiguous — ${matches.length} profiles share this name`,
      });
      continue;
    }

    toUpdate.push({
      orderId:      order.id,
      userId:       matches[0].id,
      customerName: order.customer_name,
      profile:      matches[0],
    });
  }

  /* ── print plan ── */
  console.log(hr());
  console.log(`  Will UPDATE : ${String(toUpdate.length).padStart(5)}`);
  console.log(`  Will SKIP   : ${String(skipped.length).padStart(5)}`);
  console.log(hr());
  console.log();

  if (toUpdate.length) {
    console.log("Orders queued for update:");
    console.log(`  ${"ID".padEnd(8)} ${"customer_name".padEnd(28)} ${"matched user_id (short)".padEnd(16)}  email`);
    console.log("  " + hr("─", 80));
    for (const r of toUpdate) {
      const short = r.userId.slice(0, 8) + "…";
      console.log(
        `  ${String(r.orderId).padEnd(8)} ${(r.customerName ?? "").padEnd(28)} ${short.padEnd(16)}  ${r.profile.email ?? "—"}`
      );
    }
    console.log();
  }

  if (skipped.length) {
    console.log("Orders skipped:");
    console.log(`  ${"ID".padEnd(8)} ${"customer_name".padEnd(28)} reason`);
    console.log("  " + hr("─", 70));
    for (const s of skipped) {
      console.log(
        `  ${String(s.orderId).padEnd(8)} ${(s.customerName ?? "").padEnd(28)} ${s.reason}`
      );
    }
    console.log();
  }

  /* ── dry run exit ── */
  if (DRY_RUN) {
    console.log(hr("═"));
    console.log("  DRY RUN complete — no changes written.");
    console.log("  Review the plan above, then run:");
    console.log("    DRY_RUN=false node scripts/backfill-order-user-ids.mjs");
    console.log(hr("═"));
    return;
  }

  /* ── apply updates ── */
  console.log(`⚡  Applying ${toUpdate.length} update(s)…\n`);

  let successCount = 0;
  let failCount    = 0;
  const failures   = [];

  for (const r of toUpdate) {
    const { error } = await supabase
      .from("orders")
      .update({ user_id: r.userId })
      .eq("id", r.orderId)
      .is("user_id", null);  // guard: only touch rows still NULL

    if (error) {
      failCount++;
      failures.push({ orderId: r.orderId, error: error.message });
      console.error(`  ❌  Order #${r.orderId}: ${error.message}`);
    } else {
      successCount++;
      console.log(`  ✅  Order #${r.orderId}  →  user_id ${r.userId.slice(0, 8)}… (${r.profile.email ?? r.customerName})`);
    }
  }

  /* ── final summary ── */
  console.log();
  console.log(hr("═"));
  console.log("  Backfill complete");
  console.log(`  ✅  Updated  : ${String(successCount).padStart(5)}`);
  console.log(`  ⏭️   Skipped  : ${String(skipped.length).padStart(5)}`);
  console.log(`  ❌  Failed   : ${String(failCount).padStart(5)}`);
  if (failures.length) {
    console.log("\n  Failed order IDs:");
    for (const f of failures) {
      console.log(`    #${f.orderId}: ${f.error}`);
    }
  }
  console.log(hr("═"));
}

run().catch((err) => {
  console.error("\nUnhandled error:", err);
  process.exit(1);
});
