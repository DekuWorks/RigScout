-- RigScout Phase 2 schema: catalog, user data, alerts, sync metadata.
-- Money amounts use integer minor units (e.g. cents) + ISO currency codes.
-- Learning notes: RLS is enabled on every table; public catalog is read-only
-- for anon/authenticated users; price_history inserts are service-role only.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger helper: stamp updated_at on row changes.';

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  currency text not null default 'USD',
  region text not null default 'US',
  plan_tier text not null default 'free' check (plan_tier in ('free', 'scout_pro')),
  notify_in_app boolean not null default true,
  notify_email boolean not null default true,
  privacy_share_builds boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalog: products, specs, retailers, listings, history
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text,
  model text,
  category text not null,
  description text,
  beginner_blurb text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index products_category_idx on public.products (category);
create index products_brand_idx on public.products (brand);
create index products_name_search_idx on public.products using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(model, '')));

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create table public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  key text not null,
  value text not null,
  unit text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, key)
);

create index product_specs_product_idx on public.product_specs (product_id);

create trigger product_specs_set_updated_at
before update on public.product_specs
for each row execute function public.set_updated_at();

create table public.retailers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  website_url text,
  logo_url text,
  confidence numeric(3, 2) not null default 0.80 check (confidence >= 0 and confidence <= 1),
  is_marketplace boolean not null default false,
  is_mock boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger retailers_set_updated_at
before update on public.retailers
for each row execute function public.set_updated_at();

create table public.retailer_listings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  source text not null,
  external_listing_id text not null,
  product_url text not null,
  title text,
  price_minor integer not null check (price_minor >= 0),
  shipping_minor integer check (shipping_minor is null or shipping_minor >= 0),
  currency text not null default 'USD',
  condition text not null default 'new' check (condition in ('new', 'used', 'refurbished')),
  availability text not null default 'unknown'
    check (availability in ('in_stock', 'out_of_stock', 'preorder', 'unknown')),
  deal_score numeric(4, 1),
  is_mock boolean not null default false,
  source_checked_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (retailer_id, external_listing_id),
  unique (source, external_listing_id)
);

create index retailer_listings_product_idx on public.retailer_listings (product_id);
create index retailer_listings_price_idx on public.retailer_listings (price_minor);
create index retailer_listings_deal_score_idx on public.retailer_listings (deal_score desc nulls last);

create trigger retailer_listings_set_updated_at
before update on public.retailer_listings
for each row execute function public.set_updated_at();

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.retailer_listings (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  price_minor integer not null check (price_minor >= 0),
  shipping_minor integer,
  currency text not null default 'USD',
  availability text,
  recorded_at timestamptz not null default timezone('utc', now()),
  source text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index price_history_listing_recorded_idx on public.price_history (listing_id, recorded_at desc);
create index price_history_product_recorded_idx on public.price_history (product_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- Builds
-- ---------------------------------------------------------------------------

create table public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  notes text,
  is_public boolean not null default false,
  share_slug text unique,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'archived')),
  target_total_minor integer,
  currency text not null default 'USD',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index builds_user_idx on public.builds (user_id);
create index builds_public_idx on public.builds (is_public) where is_public = true;

create trigger builds_set_updated_at
before update on public.builds
for each row execute function public.set_updated_at();

create table public.build_items (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  listing_id uuid references public.retailer_listings (id) on delete set null,
  category text not null,
  quantity integer not null default 1 check (quantity > 0),
  purchased boolean not null default false,
  paid_price_minor integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index build_items_build_idx on public.build_items (build_id);
create unique index build_items_unique_category_product
  on public.build_items (build_id, category, product_id)
  where product_id is not null;

create trigger build_items_set_updated_at
before update on public.build_items
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Watchlists, alerts, notifications
-- ---------------------------------------------------------------------------

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, product_id)
);

create index watchlists_user_idx on public.watchlists (user_id);

create trigger watchlists_set_updated_at
before update on public.watchlists
for each row execute function public.set_updated_at();

create table public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  watchlist_id uuid references public.watchlists (id) on delete set null,
  target_price_minor integer check (target_price_minor is null or target_price_minor >= 0),
  percent_drop numeric(5, 2) check (percent_drop is null or percent_drop > 0),
  channel_in_app boolean not null default true,
  channel_email boolean not null default false,
  is_active boolean not null default true,
  last_triggered_at timestamptz,
  last_triggered_price_minor integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (target_price_minor is not null or percent_drop is not null)
);

create index price_alerts_user_idx on public.price_alerts (user_id);
create index price_alerts_active_product_idx on public.price_alerts (product_id) where is_active = true;

create trigger price_alerts_set_updated_at
before update on public.price_alerts
for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  alert_id uuid references public.price_alerts (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  title text not null,
  body text not null,
  event_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, event_key)
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Compatibility rules, sync runs, affiliate clicks
-- ---------------------------------------------------------------------------

create table public.compatibility_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  severity text not null default 'warning'
    check (severity in ('info', 'warning', 'error')),
  left_category text not null,
  right_category text not null,
  left_spec_key text not null,
  right_spec_key text not null,
  operator text not null default 'eq'
    check (operator in ('eq', 'lte', 'gte', 'in')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger compatibility_rules_set_updated_at
before update on public.compatibility_rules
for each row execute function public.set_updated_at();

create table public.retailer_sync_runs (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid references public.retailers (id) on delete set null,
  source text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  listings_upserted integer not null default 0,
  history_inserted integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index retailer_sync_runs_source_created_idx
  on public.retailer_sync_runs (source, created_at desc);

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  listing_id uuid references public.retailer_listings (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  retailer_id uuid references public.retailers (id) on delete set null,
  destination_url text not null,
  referrer_path text,
  created_at timestamptz not null default timezone('utc', now())
);

create index affiliate_clicks_user_created_idx on public.affiliate_clicks (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_specs enable row level security;
alter table public.retailers enable row level security;
alter table public.retailer_listings enable row level security;
alter table public.price_history enable row level security;
alter table public.builds enable row level security;
alter table public.build_items enable row level security;
alter table public.watchlists enable row level security;
alter table public.price_alerts enable row level security;
alter table public.notifications enable row level security;
alter table public.compatibility_rules enable row level security;
alter table public.retailer_sync_runs enable row level security;
alter table public.affiliate_clicks enable row level security;

-- Profiles: users manage only their own row
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Catalog: public read for everyone; writes via service role only (no insert/update/delete policies)
create policy "products_public_read"
  on public.products for select
  using (is_active = true);

create policy "product_specs_public_read"
  on public.product_specs for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true
    )
  );

create policy "retailers_public_read"
  on public.retailers for select
  using (true);

create policy "retailer_listings_public_read"
  on public.retailer_listings for select
  using (true);

create policy "price_history_public_read"
  on public.price_history for select
  using (true);

create policy "compatibility_rules_public_read"
  on public.compatibility_rules for select
  using (is_active = true);

-- Builds: owner full access; public builds readable by anyone (limited by column selection in app)
create policy "builds_select_own_or_public"
  on public.builds for select
  using (auth.uid() = user_id or is_public = true);

create policy "builds_insert_own"
  on public.builds for insert
  with check (auth.uid() = user_id);

create policy "builds_update_own"
  on public.builds for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "builds_delete_own"
  on public.builds for delete
  using (auth.uid() = user_id);

create policy "build_items_select_own_or_public"
  on public.build_items for select
  using (
    exists (
      select 1 from public.builds b
      where b.id = build_id
        and (b.user_id = auth.uid() or b.is_public = true)
    )
  );

create policy "build_items_insert_own"
  on public.build_items for insert
  with check (
    exists (
      select 1 from public.builds b
      where b.id = build_id and b.user_id = auth.uid()
    )
  );

create policy "build_items_update_own"
  on public.build_items for update
  using (
    exists (
      select 1 from public.builds b
      where b.id = build_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.builds b
      where b.id = build_id and b.user_id = auth.uid()
    )
  );

create policy "build_items_delete_own"
  on public.build_items for delete
  using (
    exists (
      select 1 from public.builds b
      where b.id = build_id and b.user_id = auth.uid()
    )
  );

-- Watchlists / alerts / notifications: owner only
create policy "watchlists_select_own"
  on public.watchlists for select using (auth.uid() = user_id);
create policy "watchlists_insert_own"
  on public.watchlists for insert with check (auth.uid() = user_id);
create policy "watchlists_update_own"
  on public.watchlists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watchlists_delete_own"
  on public.watchlists for delete using (auth.uid() = user_id);

create policy "price_alerts_select_own"
  on public.price_alerts for select using (auth.uid() = user_id);
create policy "price_alerts_insert_own"
  on public.price_alerts for insert with check (auth.uid() = user_id);
create policy "price_alerts_update_own"
  on public.price_alerts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "price_alerts_delete_own"
  on public.price_alerts for delete using (auth.uid() = user_id);

create policy "notifications_select_own"
  on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own"
  on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_delete_own"
  on public.notifications for delete using (auth.uid() = user_id);
-- Inserts for notifications are service-role / backend only (no insert policy for anon/auth).

-- Affiliate clicks: users can insert their own attribution rows; read own
create policy "affiliate_clicks_insert_own_or_anon"
  on public.affiliate_clicks for insert
  with check (user_id is null or auth.uid() = user_id);

create policy "affiliate_clicks_select_own"
  on public.affiliate_clicks for select
  using (auth.uid() = user_id);

-- Sync runs: no policies for anon/authenticated → service role only for all ops.
-- (Service role bypasses RLS.)

-- ---------------------------------------------------------------------------
-- Realtime (notifications)
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.notifications;
