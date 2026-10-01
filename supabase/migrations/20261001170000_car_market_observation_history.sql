-- Preserve each observed listing revision before price refreshes replace current facts.
create table public.car_market_observation_history (
  observation_id uuid primary key default gen_random_uuid(),
  listing_key text not null references public.car_market_listing_observations(listing_key),
  observed_at timestamptz not null,
  facts jsonb not null,
  captured_at timestamptz not null default now(),
  unique (listing_key, observed_at)
);
alter table public.car_market_observation_history enable row level security;
revoke all on public.car_market_observation_history from anon, authenticated;

insert into public.car_market_observation_history (listing_key, observed_at, facts)
select listing_key, observed_at, to_jsonb(o) - array['review_status', 'review_reason', 'reviewed_at', 'first_seen_at', 'last_seen_at']
from public.car_market_listing_observations o;

create function public.car_market_capture_observation() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare
  excluded_fields text[] := array['review_status', 'review_reason', 'reviewed_at', 'first_seen_at', 'last_seen_at'];
begin
  if tg_op = 'INSERT' then
    insert into public.car_market_observation_history (listing_key, observed_at, facts)
    values (new.listing_key, new.observed_at, to_jsonb(new) - excluded_fields);
  elsif (to_jsonb(new) - excluded_fields) is distinct from (to_jsonb(old) - excluded_fields) then
    if new.observed_at <= old.observed_at then
      raise exception 'Changed listing facts require a newer observed_at';
    end if;
    insert into public.car_market_observation_history (listing_key, observed_at, facts)
    values (new.listing_key, new.observed_at, to_jsonb(new) - excluded_fields);
  end if;
  if tg_op = 'UPDATE' and (
    (to_jsonb(new) - excluded_fields) is distinct from (to_jsonb(old) - excluded_fields)
    or (new.review_status is distinct from old.review_status and new.review_status <> 'accepted')
  ) then
    -- A snapshot must be reviewed again after contributing facts or approval change.
    update public.car_market_price_snapshots set status = 'expired'
    where old.listing_key = any(listing_keys) and status in ('draft', 'reviewed', 'published');
  end if;
  return new;
end;
$$;
revoke all on function public.car_market_capture_observation() from public, anon, authenticated;
create trigger car_market_capture_observation
after insert or update on public.car_market_listing_observations
for each row execute function public.car_market_capture_observation();

create function public.car_market_history_immutable() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'Car market observation history is append-only';
end;
$$;
revoke all on function public.car_market_history_immutable() from public, anon, authenticated;
create trigger car_market_history_immutable
before update or delete on public.car_market_observation_history
for each row execute function public.car_market_history_immutable();

alter table public.car_market_price_snapshots
  add column observation_ids uuid[] not null default '{}',
  add constraint car_market_snapshot_observation_count
    check (cardinality(observation_ids) = sample_size);
