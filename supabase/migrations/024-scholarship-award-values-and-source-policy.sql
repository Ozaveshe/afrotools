-- Adds scholarship award-value metadata and enforceable source-crawl policy fields.
-- Target instance: AUTH - zpclagtgczsygrgztlts.supabase.co

alter table public.scholarships
  add column if not exists award_value_min numeric,
  add column if not exists award_value_max numeric,
  add column if not exists award_value_currency text,
  add column if not exists award_value_period text,
  add column if not exists award_value_text text,
  add column if not exists award_components jsonb not null default '[]'::jsonb,
  add column if not exists award_value_confidence text,
  add column if not exists award_value_source_url text,
  add column if not exists award_value_last_checked_at timestamptz;

do $$
begin
  alter table public.scholarships
    add constraint scholarships_award_value_confidence_check
    check (
      award_value_confidence is null
      or award_value_confidence in ('official', 'provider', 'curated', 'estimated', 'partial', 'unknown')
    );
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_scholarships_award_value_currency
on public.scholarships(award_value_currency)
where award_value_currency is not null;

create index if not exists idx_scholarships_award_value_checked
on public.scholarships(award_value_last_checked_at desc)
where award_value_last_checked_at is not null;

alter table public.scholarship_sources
  add column if not exists adapter_key text,
  add column if not exists adapter_version text,
  add column if not exists crawl_policy jsonb not null default '{}'::jsonb,
  add column if not exists robots_url text,
  add column if not exists robots_checked_at timestamptz,
  add column if not exists robots_allowed boolean,
  add column if not exists rate_limit_ms integer not null default 5000;

do $$
begin
  alter table public.scholarship_sources
    add constraint scholarship_sources_rate_limit_ms_check
    check (rate_limit_ms >= 0);
exception
  when duplicate_object then null;
end $$;

alter table public.scholarship_ingest_runs
  add column if not exists adapter_key text,
  add column if not exists adapter_version text,
  add column if not exists fetch_started_at timestamptz,
  add column if not exists fetch_finished_at timestamptz,
  add column if not exists fetch_status_code integer,
  add column if not exists fetch_url text,
  add column if not exists robots_allowed boolean,
  add column if not exists fetch_meta jsonb not null default '{}'::jsonb;
