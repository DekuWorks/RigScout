-- Table privileges required in addition to RLS policies.
-- RLS allows/denies rows; GRANT allows the role to touch the table at all.

grant usage on schema public to anon, authenticated, service_role;

-- Public catalog: read for everyone
grant select on table
  public.products,
  public.product_specs,
  public.retailers,
  public.retailer_listings,
  public.price_history,
  public.compatibility_rules
to anon, authenticated, service_role;

-- Profiles: authenticated users manage own row (RLS tightens)
grant select, update on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

-- User-owned data
grant select, insert, update, delete on table
  public.builds,
  public.build_items,
  public.watchlists,
  public.price_alerts,
  public.notifications,
  public.affiliate_clicks
to authenticated;

grant all on table
  public.builds,
  public.build_items,
  public.watchlists,
  public.price_alerts,
  public.notifications,
  public.affiliate_clicks,
  public.retailer_sync_runs,
  public.products,
  public.product_specs,
  public.retailers,
  public.retailer_listings,
  public.price_history,
  public.compatibility_rules
to service_role;

-- Authenticated can insert affiliate clicks; anon can insert with null user_id
grant insert on table public.affiliate_clicks to anon;

-- Sequences if any future identity columns appear
grant usage, select on all sequences in schema public to authenticated, service_role;
