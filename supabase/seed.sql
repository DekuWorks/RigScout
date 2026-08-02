-- RigScout demo seed (MOCK / placeholder data — replace with live ingestion later).
-- Demo auth users (local only):
--   demo@rigscout.local / password123
--   scout@rigscout.local / password123

-- ---------------------------------------------------------------------------
-- Demo users (auth)
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'demo@rigscout.local',
  crypt('password123', gen_salt('bf')),
  timezone('utc', now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Demo Builder"}'::jsonb,
  timezone('utc', now()),
  timezone('utc', now()),
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-4222-8222-222222222222',
  'authenticated',
  'authenticated',
  'scout@rigscout.local',
  crypt('password123', gen_salt('bf')),
  timezone('utc', now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Scout Pro User"}'::jsonb,
  timezone('utc', now()),
  timezone('utc', now()),
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values
(
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  format('{"sub":"%s","email":"demo@rigscout.local"}', '11111111-1111-4111-8111-111111111111')::jsonb,
  'email',
  '11111111-1111-4111-8111-111111111111',
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now())
),
(
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-222222222222',
  format('{"sub":"%s","email":"scout@rigscout.local"}', '22222222-2222-4222-8222-222222222222')::jsonb,
  'email',
  '22222222-2222-4222-8222-222222222222',
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now())
)
on conflict do nothing;

-- Profile trigger should have created rows; ensure plan tiers / names.
update public.profiles
set display_name = 'Demo Builder', plan_tier = 'free'
where id = '11111111-1111-4111-8111-111111111111';

update public.profiles
set display_name = 'Scout Pro User', plan_tier = 'scout_pro'
where id = '22222222-2222-4222-8222-222222222222';

-- ---------------------------------------------------------------------------
-- Retailers (placeholders)
-- ---------------------------------------------------------------------------

insert into public.retailers (id, slug, name, website_url, confidence, is_marketplace, is_mock) values
  ('a0000001-0000-4000-8000-000000000001', 'amazon-mock', 'Amazon (MOCK)', 'https://example.com/amazon', 0.90, true, true),
  ('a0000001-0000-4000-8000-000000000002', 'newegg-mock', 'Newegg (MOCK)', 'https://example.com/newegg', 0.88, false, true),
  ('a0000001-0000-4000-8000-000000000003', 'bestbuy-mock', 'Best Buy (MOCK)', 'https://example.com/bestbuy', 0.85, false, true),
  ('a0000001-0000-4000-8000-000000000004', 'microcenter-mock', 'Micro Center (MOCK)', 'https://example.com/microcenter', 0.87, false, true),
  ('a0000001-0000-4000-8000-000000000005', 'bh-mock', 'B&H (MOCK)', 'https://example.com/bh', 0.86, false, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Products + specs
-- ---------------------------------------------------------------------------

insert into public.products (id, slug, name, brand, model, category, description, beginner_blurb, is_active) values
  ('b0000001-0000-4000-8000-000000000001', 'amd-ryzen-7-7800x3d', 'AMD Ryzen 7 7800X3D', 'AMD', '7800X3D', 'cpu',
   '8-core gaming CPU with 3D V-Cache. MOCK catalog entry.',
   'The CPU is the brain of your PC. This chip is excellent for high-refresh gaming.', true),
  ('b0000001-0000-4000-8000-000000000002', 'nvidia-rtx-4070-super', 'NVIDIA GeForce RTX 4070 Super', 'NVIDIA', 'RTX 4070 Super', 'gpu',
   '1440p gaming GPU. MOCK catalog entry.',
   'The GPU draws your games. More VRAM and CUDA cores usually means smoother frames.', true),
  ('b0000001-0000-4000-8000-000000000003', 'msi-b650-tomahawk', 'MSI MAG B650 Tomahawk WiFi', 'MSI', 'B650 Tomahawk WiFi', 'motherboard',
   'AM5 ATX motherboard. MOCK catalog entry.',
   'The motherboard connects every part. Match its socket to your CPU.', true),
  ('b0000001-0000-4000-8000-000000000004', 'gskill-32gb-ddr5-6000', 'G.Skill Flare X5 32GB DDR5-6000', 'G.Skill', 'Flare X5', 'ram',
   '32GB (2x16) DDR5 kit. MOCK catalog entry.',
   'RAM is short-term memory. 32GB is a sweet spot for gaming and multitasking.', true),
  ('b0000001-0000-4000-8000-000000000005', 'samsung-990-pro-2tb', 'Samsung 990 PRO 2TB NVMe', 'Samsung', '990 PRO', 'storage',
   'PCIe 4.0 NVMe SSD. MOCK catalog entry.',
   'Storage holds your games and files. NVMe SSDs are much faster than hard drives.', true),
  ('b0000001-0000-4000-8000-000000000006', 'corsair-rm850x', 'Corsair RM850x 850W 80+ Gold', 'Corsair', 'RM850x', 'psu',
   'Fully modular 850W PSU. MOCK catalog entry.',
   'The PSU feeds power to every component. Leave headroom above estimated wattage.', true),
  ('b0000001-0000-4000-8000-000000000007', 'lian-li-lancool-216', 'Lian Li Lancool 216', 'Lian Li', 'Lancool 216', 'case',
   'ATX mid-tower with strong airflow. MOCK catalog entry.',
   'The case houses your build. Check GPU length clearance before buying a large card.', true),
  ('b0000001-0000-4000-8000-000000000008', 'thermalright-peerless-assassin', 'Thermalright Peerless Assassin 120 SE', 'Thermalright', 'PA120 SE', 'cooling',
   'Dual-tower air cooler. MOCK catalog entry.',
   'Cooling keeps your CPU safe under load. Confirm socket support before purchase.', true),
  ('b0000001-0000-4000-8000-000000000009', 'lg-27gp850', 'LG 27GP850-B 27\" 1440p 165Hz', 'LG', '27GP850-B', 'monitor',
   '1440p gaming monitor. MOCK catalog entry.',
   'A monitor displays your image. Match resolution to what your GPU can drive well.', true),
  ('b0000001-0000-4000-8000-000000000010', 'logitech-g-pro-x-superlight', 'Logitech G Pro X Superlight', 'Logitech', 'GPX', 'peripherals',
   'Wireless gaming mouse. MOCK catalog entry.',
   'Peripherals are how you interact with the PC — comfort matters as much as specs.', true)
on conflict (slug) do nothing;

insert into public.product_specs (product_id, key, value, unit) values
  ('b0000001-0000-4000-8000-000000000001', 'socket', 'AM5', null),
  ('b0000001-0000-4000-8000-000000000001', 'tdp', '120', 'W'),
  ('b0000001-0000-4000-8000-000000000002', 'length_mm', '304', 'mm'),
  ('b0000001-0000-4000-8000-000000000002', 'tdp', '220', 'W'),
  ('b0000001-0000-4000-8000-000000000002', 'pcie', '4.0 x16', null),
  ('b0000001-0000-4000-8000-000000000003', 'socket', 'AM5', null),
  ('b0000001-0000-4000-8000-000000000003', 'ram_type', 'DDR5', null),
  ('b0000001-0000-4000-8000-000000000003', 'form_factor', 'ATX', null),
  ('b0000001-0000-4000-8000-000000000004', 'ram_type', 'DDR5', null),
  ('b0000001-0000-4000-8000-000000000004', 'capacity_gb', '32', 'GB'),
  ('b0000001-0000-4000-8000-000000000005', 'interface', 'NVMe', null),
  ('b0000001-0000-4000-8000-000000000005', 'capacity_gb', '2000', 'GB'),
  ('b0000001-0000-4000-8000-000000000006', 'wattage', '850', 'W'),
  ('b0000001-0000-4000-8000-000000000006', 'efficiency', '80+ Gold', null),
  ('b0000001-0000-4000-8000-000000000007', 'form_factor_support', 'ATX,mATX,ITX', null),
  ('b0000001-0000-4000-8000-000000000007', 'gpu_clearance_mm', '392', 'mm'),
  ('b0000001-0000-4000-8000-000000000008', 'socket_support', 'AM5,AM4,LGA1700', null),
  ('b0000001-0000-4000-8000-000000000008', 'tdp_support', '220', 'W')
on conflict (product_id, key) do nothing;

-- ---------------------------------------------------------------------------
-- Listings (current prices)
-- ---------------------------------------------------------------------------

insert into public.retailer_listings (
  id, product_id, retailer_id, source, external_listing_id, product_url, title,
  price_minor, shipping_minor, currency, condition, availability, deal_score, is_mock, source_checked_at
) values
  ('c0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
   'amazon-mock', 'mock-cpu-7800x3d', 'https://example.com/mock/7800x3d', 'AMD Ryzen 7 7800X3D (MOCK)',
   35999, 0, 'USD', 'new', 'in_stock', 82.0, true, timezone('utc', now())),
  ('c0000001-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000002',
   'newegg-mock', 'mock-cpu-7800x3d-ne', 'https://example.com/mock/7800x3d-ne', 'AMD Ryzen 7 7800X3D (MOCK)',
   36999, 0, 'USD', 'new', 'in_stock', 74.0, true, timezone('utc', now())),
  ('c0000001-0000-4000-8000-000000000003', 'b0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001',
   'amazon-mock', 'mock-gpu-4070s', 'https://example.com/mock/4070-super', 'RTX 4070 Super (MOCK)',
   59999, 0, 'USD', 'new', 'in_stock', 78.5, true, timezone('utc', now())),
  ('c0000001-0000-4000-8000-000000000004', 'b0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000003',
   'bestbuy-mock', 'mock-gpu-4070s-bb', 'https://example.com/mock/4070-super-bb', 'RTX 4070 Super (MOCK)',
   62999, 0, 'USD', 'new', 'in_stock', 61.0, true, timezone('utc', now())),
  ('c0000001-0000-4000-8000-000000000005', 'b0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000002',
   'newegg-mock', 'mock-mobo-b650', 'https://example.com/mock/b650', 'MSI B650 Tomahawk (MOCK)',
   21999, 0, 'USD', 'new', 'in_stock', 70.0, true, timezone('utc', now())),
  ('c0000001-0000-4000-8000-000000000006', 'b0000001-0000-4000-8000-000000000004', 'a0000001-0000-4000-8000-000000000004',
   'microcenter-mock', 'mock-ram-32', 'https://example.com/mock/ram32', 'G.Skill 32GB DDR5 (MOCK)',
   9499, 0, 'USD', 'new', 'in_stock', 76.0, true, timezone('utc', now())),
  ('c0000001-0000-4000-8000-000000000007', 'b0000001-0000-4000-8000-000000000005', 'a0000001-0000-4000-8000-000000000005',
   'bh-mock', 'mock-ssd-990', 'https://example.com/mock/990pro', 'Samsung 990 PRO 2TB (MOCK)',
   15999, 0, 'USD', 'new', 'in_stock', 72.0, true, timezone('utc', now())),
  ('c0000001-0000-4000-8000-000000000008', 'b0000001-0000-4000-8000-000000000006', 'a0000001-0000-4000-8000-000000000001',
   'amazon-mock', 'mock-psu-850', 'https://example.com/mock/rm850x', 'Corsair RM850x (MOCK)',
   13999, 0, 'USD', 'new', 'in_stock', 68.0, true, timezone('utc', now())),
  ('c0000001-0000-4000-8000-000000000009', 'b0000001-0000-4000-8000-000000000007', 'a0000001-0000-4000-8000-000000000002',
   'newegg-mock', 'mock-case-216', 'https://example.com/mock/lancool216', 'Lian Li Lancool 216 (MOCK)',
   10999, 599, 'USD', 'new', 'in_stock', 65.0, true, timezone('utc', now())),
  ('c0000001-0000-4000-8000-000000000010', 'b0000001-0000-4000-8000-000000000008', 'a0000001-0000-4000-8000-000000000001',
   'amazon-mock', 'mock-cooler-pa120', 'https://example.com/mock/pa120', 'Thermalright PA120 SE (MOCK)',
   3599, 0, 'USD', 'new', 'in_stock', 88.0, true, timezone('utc', now()))
on conflict (source, external_listing_id) do nothing;

-- ---------------------------------------------------------------------------
-- 90 days of sample price history for key listings
-- ---------------------------------------------------------------------------

insert into public.price_history (listing_id, product_id, price_minor, shipping_minor, currency, availability, recorded_at, source)
select
  l.id,
  l.product_id,
  greatest(
    1000,
    l.price_minor
      + (random() * 8000 - 3000)::int
      + ((90 - g.day) * 20)
  )::int,
  l.shipping_minor,
  l.currency,
  l.availability,
  timezone('utc', now()) - (g.day || ' days')::interval,
  l.source
from public.retailer_listings l
cross join generate_series(0, 89) as g(day)
where l.id in (
  'c0000001-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000003',
  'c0000001-0000-4000-8000-000000000005',
  'c0000001-0000-4000-8000-000000000006'
);

-- ---------------------------------------------------------------------------
-- Compatibility rules (guidance, not guarantees)
-- ---------------------------------------------------------------------------

insert into public.compatibility_rules (code, name, description, severity, left_category, right_category, left_spec_key, right_spec_key, operator) values
  ('cpu_mobo_socket', 'CPU ↔ Motherboard socket',
   'CPU socket should match motherboard socket. Guidance only — verify QVL and BIOS.',
   'error', 'cpu', 'motherboard', 'socket', 'socket', 'eq'),
  ('ram_mobo_type', 'RAM ↔ Motherboard type',
   'RAM type (DDR4/DDR5) should match motherboard support.',
   'error', 'ram', 'motherboard', 'ram_type', 'ram_type', 'eq'),
  ('mobo_case_form', 'Motherboard ↔ Case form factor',
   'Case should support the motherboard form factor.',
   'warning', 'motherboard', 'case', 'form_factor', 'form_factor_support', 'in'),
  ('gpu_case_length', 'GPU length ↔ Case clearance',
   'GPU length should be within case clearance when both specs exist.',
   'warning', 'gpu', 'case', 'length_mm', 'gpu_clearance_mm', 'lte'),
  ('cooler_cpu_socket', 'Cooler ↔ CPU socket',
   'Cooler should list support for the CPU socket.',
   'warning', 'cooling', 'cpu', 'socket_support', 'socket', 'in'),
  ('psu_wattage_headroom', 'PSU wattage headroom',
   'PSU wattage should exceed estimated system draw. Guidance only.',
   'warning', 'psu', 'gpu', 'wattage', 'tdp', 'gte')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Demo builds / watchlists / alerts / notifications
-- ---------------------------------------------------------------------------

insert into public.builds (id, user_id, name, notes, is_public, share_slug, status, target_total_minor, currency) values
  ('d0000001-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Dream Build 2025', 'Demo build for RigScout Phase 2.', false, null, 'in_progress', 180000, 'USD'),
  ('d0000001-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'Streaming Setup', 'Public share example (MOCK).', true, 'demo-streaming-setup', 'in_progress', 140000, 'USD'),
  ('d0000001-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222',
   'Isolation Test Build', 'Belongs to scout user — used to verify RLS.', false, null, 'in_progress', 200000, 'USD')
on conflict (id) do nothing;

insert into public.build_items (build_id, product_id, listing_id, category, quantity, purchased, paid_price_minor) values
  ('d0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'cpu', 1, true, 37999),
  ('d0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000003', 'gpu', 1, false, null),
  ('d0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000005', 'motherboard', 1, false, null),
  ('d0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000006', 'ram', 1, false, null),
  ('d0000001-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'cpu', 1, false, null),
  ('d0000001-0000-4000-8000-000000000003', 'b0000001-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000003', 'gpu', 1, false, null);

insert into public.watchlists (id, user_id, product_id, notes) values
  ('e0000001-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'b0000001-0000-4000-8000-000000000002', 'Waiting for sub-$580'),
  ('e0000001-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'b0000001-0000-4000-8000-000000000001', 'Watching CPU dips'),
  ('e0000001-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222',
   'b0000001-0000-4000-8000-000000000005', 'Scout-only watchlist item')
on conflict (user_id, product_id) do nothing;

insert into public.price_alerts (id, user_id, product_id, watchlist_id, target_price_minor, percent_drop, channel_in_app, channel_email, is_active) values
  ('f0000001-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'b0000001-0000-4000-8000-000000000002', 'e0000001-0000-4000-8000-000000000001',
   57999, null, true, true, true),
  ('f0000001-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'b0000001-0000-4000-8000-000000000001', 'e0000001-0000-4000-8000-000000000002',
   null, 10.00, true, false, true),
  ('f0000001-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222',
   'b0000001-0000-4000-8000-000000000005', 'e0000001-0000-4000-8000-000000000003',
   14999, null, true, true, true);

insert into public.notifications (user_id, alert_id, product_id, title, body, event_key) values
  ('11111111-1111-4111-8111-111111111111', 'f0000001-0000-4000-8000-000000000001',
   'b0000001-0000-4000-8000-000000000002',
   'Price drop nearby',
   'RTX 4070 Super (MOCK) is closer to your $579.99 target.',
   'demo-alert-4070s-2026-08-01'),
  ('22222222-2222-4222-8222-222222222222', 'f0000001-0000-4000-8000-000000000003',
   'b0000001-0000-4000-8000-000000000005',
   'Watchlist update',
   'Samsung 990 PRO still above your target (MOCK).',
   'demo-alert-990pro-2026-08-01');

insert into public.retailer_sync_runs (retailer_id, source, status, started_at, finished_at, listings_upserted, history_inserted, metadata)
values (
  'a0000001-0000-4000-8000-000000000001',
  'amazon-mock',
  'succeeded',
  timezone('utc', now()) - interval '1 hour',
  timezone('utc', now()) - interval '55 minutes',
  10,
  360,
  '{"note":"MOCK seed sync run"}'::jsonb
);
