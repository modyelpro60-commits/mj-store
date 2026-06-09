-- ─── Order Flow v2 — Manual Payment ─────────────────────────────────────────
-- Adds:
--   • payment_proof_url column on orders (screenshot URL from checkout)
--   • New notification types for full payment lifecycle
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- 1. Add payment_proof_url to orders
alter table public.orders add column if not exists payment_proof_url text;

-- 2. Extend the notifications type check constraint
--    Drop the old constraint by its exact name, then re-add with the full set.
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    -- existing types (must keep all of them)
    'order_approved',
    'order_rejected',
    'new_message',
    'review_reply',
    'support_reply',
    'role_changed',
    'status_changed',
    -- new types for order flow v2
    'new_order',
    'payment_confirmed',
    'payment_rejected',
    'order_delivered'
  ));

commit;
