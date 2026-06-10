/* ════════════════════════════════════════════════════════════════════════════
 *  Payment configuration
 *  Static fallback values — live settings are managed in Admin → Settings
 *  and stored in the store_settings table.
 * ════════════════════════════════════════════════════════════════════════════ */

export const PAYMENT = {
  vodafone: {
    number: "01000000000",
  },
  instapay: {
    qrImage: "/instapay-qr.png",
    handle: "",
  },
  usdt: {
    walletAddress: "",
    qrImage: "",
    network: "BNB Smart Chain (BEP20)",
    rateEgp: 50,   // 1 USDT = X EGP — overridden by admin settings
    feePct: 3,     // transfer fee % — overridden by admin settings
  },
};

export const PAYMENT_METHODS = [
  { id: "vodafone", label: "Vodafone Cash", labelAr: "فودافون كاش" },
  { id: "instapay", label: "InstaPay",      labelAr: "إنستا باي"   },
  { id: "usdt",     label: "USDT (BEP20)",  labelAr: "USDT (BEP20)" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

/* Settings shape returned by GET /api/settings */
export interface PaymentSettings {
  vodafone_number:     string;
  vodafone_enabled:    string;
  instapay_handle:     string;
  instapay_qr_image:   string;
  instapay_enabled:    string;
  usdt_wallet_address: string;
  usdt_qr_image:       string;
  usdt_enabled:        string;
  usdt_rate_egp:       string;
  usdt_fee_pct:        string;
}

/* A single entry in the payment_accounts table */
export interface PaymentAccount {
  id:           string;
  method:       string;
  name:         string;
  value:        string;
  qr_image:     string | null;
  is_active:    boolean;
  usage_count:  number;
  last_used_at: string | null;
  created_at:   string;
}
