-- Review replies — staff responses to product reviews
-- Allowed roles: admin, moderator, helper (enforced in API layer)
-- RLS is permissive for insert by authenticated users; role check happens server-side.

begin;

create table if not exists public.review_replies (
  id          bigint      primary key generated always as identity,
  review_id   bigint      not null references public.product_reviews(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id)        on delete cascade,
  body        text        not null check (char_length(body) >= 2 and char_length(body) <= 1000),
  created_at  timestamptz not null default now()
);

alter table public.review_replies enable row level security;

-- Anyone can read replies (reviews are public)
drop policy if exists "replies_select_all" on public.review_replies;
create policy "replies_select_all"
  on public.review_replies for select
  using (true);

-- Only the owner can insert (role gate is enforced server-side via service role key)
drop policy if exists "replies_insert_own" on public.review_replies;
create policy "replies_insert_own"
  on public.review_replies for insert
  with check (auth.uid() = user_id);

-- Only the owner can delete their reply
drop policy if exists "replies_delete_own" on public.review_replies;
create policy "replies_delete_own"
  on public.review_replies for delete
  using (auth.uid() = user_id);

create index if not exists idx_review_replies_review_id on public.review_replies(review_id);
create index if not exists idx_review_replies_user_id   on public.review_replies(user_id);

commit;
