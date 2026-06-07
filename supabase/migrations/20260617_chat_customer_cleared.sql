-- ─── Chat: clear conversation from the customer's side on close ─────────────
-- When staff close a chat, we stamp customer_cleared_at = now(). The customer
-- then only sees messages created AFTER that point (i.e. a fresh, empty chat),
-- while staff keep the full history.
begin;

alter table public.chat_rooms
  add column if not exists customer_cleared_at timestamptz null;

commit;
