-- ── Payment settings + USDT support ──────────────────────────────────────────
BEGIN;

-- Key-value store for all admin-configurable settings
CREATE TABLE IF NOT EXISTS store_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default values (do not overwrite existing)
INSERT INTO store_settings (key, value) VALUES
  ('vodafone_number',     '01000000000'),
  ('vodafone_enabled',    'true'),
  ('instapay_handle',     ''),
  ('instapay_qr_image',   ''),
  ('instapay_enabled',    'true'),
  ('usdt_wallet_address', ''),
  ('usdt_qr_image',       ''),
  ('usdt_enabled',        'false'),
  ('usdt_rate_egp',       '50'),
  ('usdt_fee_pct',        '3')
ON CONFLICT (key) DO NOTHING;

-- Orders: USDT transaction metadata (nullable — only set for USDT orders)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS usdt_amount  NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS usdt_rate    NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS usdt_fee_pct NUMERIC;

COMMIT;
