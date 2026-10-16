-- Service-only, moderated community regulatory intake. Apply separately after review.
-- Existing gazette_changes and review_queue remain the operator workflow.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '15s';

create table public.regulatory_report_receipts (
  request_id uuid primary key,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  receipt_id uuid not null unique default gen_random_uuid(),
  gazette_id uuid not null unique references public.gazette_changes(id),
  review_queue_id uuid not null unique references public.review_queue(id),
  received_at timestamptz not null default transaction_timestamp()
);
create table public.regulatory_report_quotas (
  quota_key text primary key check (quota_key ~ '^[a-f0-9]{64}$'),
  bucket_date date not null,
  accepted_count smallint not null default 0 check (accepted_count between 0 and 5),
  expires_at timestamptz not null default (transaction_timestamp() + interval '48 hours')
);
create index regulatory_report_quota_expiry on public.regulatory_report_quotas(expires_at);
alter table public.regulatory_report_receipts enable row level security;
alter table public.regulatory_report_quotas enable row level security;
revoke all on public.regulatory_report_receipts, public.regulatory_report_quotas from public, anon, authenticated;
grant select, insert, update, delete on public.regulatory_report_receipts, public.regulatory_report_quotas to service_role;
create policy "Service role manages regulatory report receipts" on public.regulatory_report_receipts for all to service_role using (true) with check (true);
create policy "Service role manages regulatory report quotas" on public.regulatory_report_quotas for all to service_role using (true) with check (true);

create function public.submit_regulatory_report(p_request_id uuid, p_payload jsonb, p_quota_key text, p_day date)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public
set statement_timeout = '5s'
set lock_timeout = '2s'
as $$
declare
  saved public.regulatory_report_receipts%rowtype;
  payload_hash text;
  gazette_id uuid;
  queue_id uuid;
  used integer;
  effective_date date;
  legacy_change_type text;
  today date := (transaction_timestamp() at time zone 'UTC')::date;
begin
  if p_request_id is null or p_request_id::text !~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
    or p_payload is null or jsonb_typeof(p_payload) <> 'object'
    or (select count(*) from jsonb_object_keys(p_payload)) <> 6
    or not (p_payload ?& array['country_code','change_type','title','details','source_url','effective_date'])
    or jsonb_typeof(p_payload->'country_code') <> 'string'
    or jsonb_typeof(p_payload->'change_type') <> 'string'
    or jsonb_typeof(p_payload->'title') <> 'string'
    or jsonb_typeof(p_payload->'details') <> 'string'
    or p_payload->>'country_code' <> all(array['DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CD','CG','CI','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW'])
    or p_payload->>'change_type' <> all(array['minimum-wage','paye-bands','pension-rate','social-security','new-levy','tax-threshold','cit-rate','filing-deadline'])
    or char_length(btrim(p_payload->>'title')) not between 5 and 140
    or octet_length(p_payload->>'title') > 560
    or char_length(btrim(p_payload->>'details')) not between 20 and 2000
    or octet_length(p_payload->>'details') > 8000
    or ((p_payload->>'title') || (p_payload->>'details')) ~ '[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]'
    or (p_payload->'source_url' <> 'null'::jsonb and (jsonb_typeof(p_payload->'source_url') <> 'string' or octet_length(p_payload->>'source_url') > 2048 or p_payload->>'source_url' !~ '^https?://[^/[:space:]<>"''@\\]+([/?#][^[:space:]<>"''\\]*)?$'))
  then raise sqlstate 'PT400' using message = 'Invalid report'; end if;
  if p_payload->'effective_date' <> 'null'::jsonb then
    if jsonb_typeof(p_payload->'effective_date') <> 'string' or p_payload->>'effective_date' !~ '^\d{4}-\d{2}-\d{2}$' then raise sqlstate 'PT400' using message = 'Invalid date'; end if;
    begin
      effective_date := (p_payload->>'effective_date')::date;
      if effective_date not between date '1900-01-01' and date '2200-12-31' then raise exception 'date range'; end if;
    exception when others then raise sqlstate 'PT400' using message = 'Invalid date'; end;
  end if;
  payload_hash := encode(sha256(convert_to(p_payload::text, 'UTF8')), 'hex');
  -- Same request across workers/days serializes before quota: exact replay costs zero.
  perform pg_advisory_xact_lock(hashtextextended('regulatory-request:' || p_request_id::text, 0));
  select * into saved from public.regulatory_report_receipts where request_id = p_request_id;
  if found then
    if saved.payload_hash <> payload_hash then raise sqlstate 'PT409' using message = 'Request conflict'; end if;
    return jsonb_build_object('status','pending_review','receipt_id',saved.receipt_id,'received_at',saved.received_at);
  end if;
  if p_quota_key is null or p_quota_key !~ '^[a-f0-9]{64}$' or p_day is null or p_day <> today then raise sqlstate 'PT400' using message = 'Invalid quota key or day'; end if;
  -- Lazy cleanup only: at most 1000 expired keys per accepted intake transaction.
  -- This is expiry eligibility, NOT a guaranteed wall-clock deletion service.
  delete from public.regulatory_report_quotas where quota_key in (
    select q.quota_key from public.regulatory_report_quotas q where q.expires_at < transaction_timestamp()
    order by q.expires_at limit 1000 for update skip locked
  );
  insert into public.regulatory_report_quotas(quota_key,bucket_date) values(p_quota_key,today) on conflict do nothing;
  select accepted_count into used from public.regulatory_report_quotas where quota_key=p_quota_key and bucket_date=today for update;
  if not found then raise sqlstate 'PT400' using message = 'Quota day conflict'; end if;
  if used >= 5 then raise sqlstate 'PT429' using message = 'Daily report limit'; end if;
  -- Gazette's existing CHECK uses a narrower legacy taxonomy. Preserve that
  -- domain; keep the original UI type in description and review_queue.metric.
  legacy_change_type := case p_payload->>'change_type'
    when 'minimum-wage' then 'minimum_wage'
    when 'paye-bands' then 'paye_bracket'
    when 'pension-rate' then 'pension_rate'
    else 'other'
  end;
  insert into public.gazette_changes(country_code,change_type,description,effective_date,source_url,source_name,confidence,verified,applied_to_tools)
  values(p_payload->>'country_code',legacy_change_type,'[Reported UI type: ' || (p_payload->>'change_type') || E']\n' || (p_payload->>'title') || E'\n' || (p_payload->>'details'),effective_date,p_payload->>'source_url','Community report (unverified)',0,false,false) returning id into gazette_id;
  insert into public.review_queue(category,country_code,metric,reason,status,notes)
  values('gazette',p_payload->>'country_code',p_payload->>'change_type','community_regulatory_report','pending','Community report: ' || gazette_id::text || '. Verify the source before any manual tool update.') returning id into queue_id;
  insert into public.regulatory_report_receipts(request_id,payload_hash,gazette_id,review_queue_id)
  values(p_request_id,payload_hash,gazette_id,queue_id) returning * into saved;
  update public.regulatory_report_quotas set accepted_count=accepted_count+1 where quota_key=p_quota_key;
  return jsonb_build_object('status','pending_review','receipt_id',saved.receipt_id,'received_at',saved.received_at);
end;
$$;
revoke all on function public.submit_regulatory_report(uuid,jsonb,text,date) from public, anon, authenticated;
grant execute on function public.submit_regulatory_report(uuid,jsonb,text,date) to service_role;

-- Keep community decisions internally consistent, including repeats/opposites.
-- Legacy scanner decisions remain on their existing application path.
create function public.review_regulatory_report(p_gazette_id uuid, p_action text, p_notes text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public
set statement_timeout = '5s' set lock_timeout = '2s'
as $$
declare saved public.regulatory_report_receipts%rowtype;
begin
  if p_action is null or p_action not in ('approve','reject') or p_notes is null or char_length(p_notes)>2000 then raise sqlstate 'PT400' using message='Invalid report decision'; end if;
  select * into saved from public.regulatory_report_receipts where gazette_id=p_gazette_id for update;
  if not found then raise sqlstate 'PT404' using message='Report receipt not found'; end if;
  update public.gazette_changes set verified=(p_action='approve'),verified_at=transaction_timestamp(),applied_to_tools=(p_action='reject')
  where id=saved.gazette_id and source_name='Community report (unverified)';
  if not found then raise sqlstate 'PT409' using message='Report signal association changed'; end if;
  update public.review_queue set status=case when p_action='approve' then 'approved' else 'rejected' end,
    reviewed_by='admin',reviewed_at=transaction_timestamp(),notes=p_notes || ' [community regulatory report decision]'
  where id=saved.review_queue_id and category='gazette' and reason='community_regulatory_report';
  if not found then raise sqlstate 'PT409' using message='Report queue association changed'; end if;
  return jsonb_build_object('ok',true,'decision',p_action,'gazette_id',saved.gazette_id);
end;
$$;
revoke all on function public.review_regulatory_report(uuid,text,text) from public, anon, authenticated;
grant execute on function public.review_regulatory_report(uuid,text,text) to service_role;
comment on table public.regulatory_report_quotas is 'Daily HMAC IP keys, eligible for lazy pruning after 48 hours; no raw IP. Idle periods can retain expired keys longer.';
comment on table public.regulatory_report_receipts is 'Private receipt association/hash retained with moderated gazette signals; no duplicate report body or raw IP.';
commit;
