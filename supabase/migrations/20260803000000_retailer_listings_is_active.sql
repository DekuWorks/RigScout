-- Alert job filters active listings via retailer_listings.is_active.
-- Column was referenced in apps/api but missing from phase2 schema.

alter table public.retailer_listings
  add column if not exists is_active boolean not null default true;

create index if not exists retailer_listings_active_product_idx
  on public.retailer_listings (product_id)
  where is_active = true;
