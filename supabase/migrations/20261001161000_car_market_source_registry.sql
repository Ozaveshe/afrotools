-- A source is eligible for scheduled ingestion only after explicit access review.
insert into public.car_market_sources
  (source_id, display_name, domain, country_code, terms_url, robots_url, access_status, last_policy_checked_at, access_notes)
values
  ('autochek-ng', 'Autochek Nigeria', 'autochek.africa', 'NG', 'https://autochek.africa/ng/terms-of-service', 'https://autochek.africa/robots.txt', 'manual-only', '2026-10-01T14:14:26Z', 'Terms prohibit data mining/extraction; no automated ingestion without permission.'),
  ('beforward-jp', 'BE FORWARD Japan', 'beforward.jp', 'JP', null, 'https://www.beforward.jp/robots.txt', 'review-needed', '2026-10-01T14:14:26Z', 'Robots reviewed; commercial reuse terms and permission still require review before automation.'),
  ('jiji-ng', 'Jiji Nigeria', 'jiji.ng', 'NG', null, 'https://jiji.ng/robots.txt', 'blocked', '2026-10-01T14:14:26Z', 'Direct browsing reached a security challenge; no bypass or scheduled collector.'),
  ('yallamotor-uae', 'YallaMotor UAE', 'uae.yallamotor.com', 'AE', 'https://www.yallamotor.com/terms-of-service', 'https://uae.yallamotor.com/robots.txt', 'manual-only', '2026-10-01T14:14:26Z', 'Terms prohibit automated scraping; only individually reviewed public facts pending permission.')
on conflict (source_id) do nothing;

create index if not exists car_market_runs_source_idx on public.car_market_ingest_runs(source_id);
create index if not exists car_market_listings_run_idx on public.car_market_listing_observations(run_id);
