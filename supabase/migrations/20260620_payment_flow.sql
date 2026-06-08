-- ─── Manual payment flow + chat image attachments ───────────────────────────
begin;

-- Chat: allow image attachments (payment screenshots)
alter table public.chat_messages add column if not exists image_url text;

-- Orders: record chosen manual payment method (Vodafone Cash / InstaPay)
alter table public.orders add column if not exists payment_method text;

commit;
