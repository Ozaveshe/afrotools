-- Primary source terms checked on 2026-10-01: no data extraction/automated collection.
update public.car_market_sources
set access_status = 'blocked',
    access_notes = 'Terms restrict data extraction and commercialization. Obtain written feed permission before ingestion.',
    last_policy_checked_at = now(), updated_at = now()
where source_id = 'autochek-ng';

update public.car_market_sources
set access_status = 'blocked',
    access_notes = 'Terms prohibit automated collection and copying. Obtain written feed permission before ingestion.',
    last_policy_checked_at = now(), updated_at = now()
where source_id = 'yallamotor-uae';
