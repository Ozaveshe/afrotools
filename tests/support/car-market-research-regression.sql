-- Synthetic database guard checks. All test rows are rolled back.
begin;
insert into public.car_market_sources (source_id,display_name,domain,access_status)
values ('research-regression-20261001','Synthetic research regression','example.org','review-needed');
insert into public.car_market_research (research_key,source_id,listing_url,observed_at,listing_added_on,vehicle_id,make,model,model_year,country_code,market,condition_label,asking_price,currency,verification_level,quality_flags)
values (repeat('a',64),'research-regression-20261001','https://example.org/car/123',now(),current_date,'toyota-corolla-2016','Toyota','Corolla',2016,'NG','Synthetic','foreign-used',15000000,'NGN','detail-page-checked','["availability-unconfirmed"]');
do $$
begin
  if not (select relrowsecurity from pg_class where oid='public.car_market_research'::regclass) or has_table_privilege('anon','public.car_market_research','select') or has_table_privilege('authenticated','public.car_market_research','select') then raise exception 'Private research access failed'; end if;
  begin
    update public.car_market_research set asking_price=16000000 where research_key=repeat('a',64);
    raise exception 'Expected immutable research';
  exception when raise_exception then
    if sqlerrm <> 'Research facts are append-only' then raise; end if;
  end;
  begin
    insert into public.car_market_research select repeat('b',64),source_id,'https://example.org/car/124',source_listing_id,observed_at,listing_added_on,vehicle_id,make,'Camry',model_year,country_code,market,condition_label,trim_label,asking_price,currency,mileage_value,mileage_unit,verification_level,quality_flags,captured_at from public.car_market_research where research_key=repeat('a',64);
    raise exception 'Expected catalog mismatch';
  exception when raise_exception then
    if sqlerrm <> 'Catalog identity mismatch' then raise; end if;
  end;
  begin
    insert into public.car_market_research select repeat('c',64),source_id,'https://example.org.evil.test/car/124',source_listing_id,observed_at,listing_added_on,vehicle_id,make,model,model_year,country_code,market,condition_label,trim_label,asking_price,currency,mileage_value,mileage_unit,verification_level,quality_flags,captured_at from public.car_market_research where research_key=repeat('a',64);
    raise exception 'Expected domain rejection';
  exception when raise_exception then
    if sqlerrm <> 'URL outside source domain or contains query/fragment' then raise; end if;
  end;
  begin
    insert into public.car_market_research select repeat('d',64),source_id,'https://example.org/car/125',source_listing_id,observed_at,current_date-100,vehicle_id,make,model,model_year,country_code,market,condition_label,trim_label,asking_price,currency,mileage_value,mileage_unit,verification_level,quality_flags,captured_at from public.car_market_research where research_key=repeat('a',64);
    raise exception 'Expected old listing flag';
  exception when raise_exception then
    if sqlerrm <> 'Old listing requires age flag' then raise; end if;
  end;
  update public.car_market_sources set access_status='blocked' where source_id='research-regression-20261001';
  begin
    insert into public.car_market_research select repeat('e',64),source_id,'https://example.org/car/126',source_listing_id,observed_at,listing_added_on,vehicle_id,make,model,model_year,country_code,market,condition_label,trim_label,asking_price,currency,mileage_value,mileage_unit,verification_level,quality_flags,captured_at from public.car_market_research where research_key=repeat('a',64);
    raise exception 'Expected blocked source';
  exception when raise_exception then
    if sqlerrm <> 'Source unavailable for research' then raise; end if;
  end;
end $$;
rollback;
select 'research guards passed; synthetic rows rolled back' as result;
