-- ── Multi Payment Accounts System ──────────────────────────────────────────
-- Replaces single-account store_settings with a proper multi-account table.
-- Old store_settings keys (vodafone_number, instapay_handle, etc.) are kept
-- as-is for backward-compat fallback but are no longer the primary source.
-- ────────────────────────────────────────────────────────────────────────────
BEGIN;

-- ── 1. payment_accounts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_accounts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  method       TEXT        NOT NULL,                  -- 'vodafone' | 'instapay' | 'usdt'
  name         TEXT        NOT NULL DEFAULT '',       -- admin-assigned label
  value        TEXT        NOT NULL,                  -- phone / handle / wallet address
  qr_image     TEXT,                                  -- QR code URL (nullable)
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  usage_count  INTEGER     NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast Round Robin query: active accounts for a method, sorted by last_used_at
CREATE INDEX IF NOT EXISTS idx_payment_accounts_rr
  ON payment_accounts (method, is_active, last_used_at NULLS FIRST);

-- ── 2. Order snapshot columns ─────────────────────────────────────────────
-- Keeps a frozen copy of the account at order creation time.
-- The reference is nullable (SET NULL if account is deleted).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_account_id       UUID
    REFERENCES payment_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_account_snapshot JSONB;

-- ── 3. Atomic usage increment function ───────────────────────────────────
-- Called from the server after every successful order creation.
CREATE OR REPLACE FUNCTION increment_account_usage(account_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE payment_accounts
  SET usage_count  = usage_count + 1,
      last_used_at = now()
  WHERE id = account_id;
$$;

COMMIT;
