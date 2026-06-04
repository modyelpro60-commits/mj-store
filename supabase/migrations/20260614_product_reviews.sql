-- Create product reviews table
create table if not exists product_reviews (
  id bigint primary key generated always as identity,
  product_id bigint not null references products(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table product_reviews enable row level security;

-- Anyone can read reviews
create policy "Anyone can view reviews"
  on product_reviews for select
  using (true);

-- Authenticated users can insert their own reviews
create policy "Authenticated users can insert reviews"
  on product_reviews for insert
  with check (auth.uid() = user_id);

-- Users can update/delete their own reviews
create policy "Users can update own reviews"
  on product_reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on product_reviews for delete
  using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists idx_product_reviews_product_id on product_reviews(product_id);
create index if not exists idx_product_reviews_user_id on product_reviews(user_id);
