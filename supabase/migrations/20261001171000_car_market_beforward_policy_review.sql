create function public.car_market_revoke_source_evidence() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.access_status is distinct from old.access_status
    and new.access_status in ('blocked', 'review-needed', 'retired') then
    update public.car_market_listing_observations
    set review_status = 'expired', review_reason = 'Source access requires a new rights review', reviewed_at = now()
    where source_id = new.source_id and review_status = 'accepted';
    update public.car_market_price_snapshots set status = 'expired'
    where new.source_id = any(source_ids) and status in ('draft', 'reviewed', 'published');
  end if;
  return new;
end;
$$;
revoke all on function public.car_market_revoke_source_evidence() from public, anon, authenticated;
create trigger car_market_revoke_source_evidence
after update of access_status on public.car_market_sources
for each row execute function public.car_market_revoke_source_evidence();

update public.car_market_sources
set access_status = 'blocked', terms_url = 'https://www.beforward.jp/terms',
  last_policy_checked_at = '2026-10-01T15:00:00Z', updated_at = now(),
  access_notes = 'Terms section 5 restricts copying, publishing, displaying and exploiting information from the website. No feed or commercial reuse permission is recorded; deny intake pending an agreement.'
where source_id = 'beforward-jp';
