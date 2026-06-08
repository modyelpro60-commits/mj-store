-- ─── Profile phone (contact) + Email OTP verification ───────────────────────
begin;

-- Phone is collected for order contact (stored, not OTP-verified).
alter table public.profiles add column if not exists phone          text;
-- Kept for backward-compat with /api/auth/me (unused by the email flow).
alter table public.profiles add column if not exists phone_verified boolean not null default false;

-- Generic OTP store (keyed by identifier = the email being verified).
create table if not exists public.otp_verifications (
  identifier text        primary key,   -- email being verified
  code       text,
  verified   boolean     not null default false,
  expires_at timestamptz,
  attempts   int         not null default 0,
  updated_at timestamptz not null default now()
);

-- Service-role only (bypasses RLS); deny everyone else.
alter table public.otp_verifications enable row level security;

commit;
