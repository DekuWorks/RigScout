-- RLS smoke checks for local Supabase.
-- Run after `supabase db reset` while connected as a SQL role that can set request.jwt.claim.
-- Example (psql via supabase db):
--   supabase db execute --file supabase/tests/rls_smoke.sql
--
-- These statements document expected isolation. Adjust runner as needed for your CLI version.

-- As demo user, private build of scout user must not be visible.
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Expect 0 rows for scout-only private build
select count(*) as should_be_zero
from public.builds
where id = 'd0000001-0000-4000-8000-000000000003';

-- Expect public shared build visible
select count(*) as should_be_one
from public.builds
where share_slug = 'demo-streaming-setup';

-- Expect own notifications only
select count(*) as demo_notifications
from public.notifications;

-- Catalog remains readable
select count(*) as products_visible from public.products;
