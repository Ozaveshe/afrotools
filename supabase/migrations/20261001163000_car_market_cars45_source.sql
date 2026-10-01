-- Public listings exist, but republication/automation rights are not yet verified.
insert into public.car_market_sources
  (source_id, display_name, domain, country_code, access_status, last_policy_checked_at, access_notes)
values
  ('cars45-ng', 'Cars45 Nigeria', 'cars45.com', 'NG', 'review-needed', now(),
   'Individual listing pages found; no confirmed collection or republication rights. No intake until reviewed.')
on conflict (source_id) do nothing;
