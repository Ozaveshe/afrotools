-- Browser viewing worked, but Jiji's terms restrict copying user content.
update public.car_market_sources
set terms_url = 'https://jiji.ng/rules.html',
    access_status = 'blocked',
    access_notes = 'Listings are browser-viewable, but terms restrict copying user content without consent. Research only; obtain feed/publication rights before intake.',
    last_policy_checked_at = now(), updated_at = now()
where source_id = 'jiji-ng';
