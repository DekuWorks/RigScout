-- RigScout default seed (production-safe).
-- No demo products, listings, users, builds, or alerts.
-- For local UI demos only: also apply seed_demo.sql (see docs/DATABASE.md).

-- ---------------------------------------------------------------------------
-- Real retailers (slugs used by live adapters + feed import)
-- ---------------------------------------------------------------------------

insert into public.retailers (id, slug, name, website_url, confidence, is_marketplace, is_mock) values
  ('a0000001-0000-4000-8000-000000000011', 'amazon', 'Amazon', 'https://www.amazon.com', 0.88, true, false),
  ('a0000001-0000-4000-8000-000000000012', 'newegg', 'Newegg', 'https://www.newegg.com', 0.85, true, false),
  ('a0000001-0000-4000-8000-000000000013', 'bestbuy', 'Best Buy', 'https://www.bestbuy.com', 0.90, false, false),
  ('a0000001-0000-4000-8000-000000000014', 'microcenter', 'Micro Center', 'https://www.microcenter.com', 0.87, false, false)
on conflict (slug) do update set
  name = excluded.name,
  website_url = excluded.website_url,
  confidence = excluded.confidence,
  is_marketplace = excluded.is_marketplace,
  is_mock = excluded.is_mock;

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
