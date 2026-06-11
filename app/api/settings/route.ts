import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default fallback values if table doesn't exist yet
const DEFAULTS: Record<string, string> = {
  vodafone_number:     "",
  vodafone_enabled:    "true",
  instapay_handle:     "",
  instapay_qr_image:   "",
  instapay_enabled:    "true",
  usdt_wallet_address: "",
  usdt_qr_image:       "",
  usdt_enabled:        "false",
  usdt_rate_egp:       "50",
  usdt_fee_pct:        "3",
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("key, value");

    if (error || !data) {
      // Table may not exist yet — return defaults
      return NextResponse.json(DEFAULTS);
    }

    const settings = { ...DEFAULTS };
    for (const row of data) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}
