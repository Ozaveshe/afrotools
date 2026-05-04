alter table public.as_news_sources
  add column if not exists last_checked_at timestamp with time zone,
  add column if not exists last_success_at timestamp with time zone,
  add column if not exists last_status_code integer,
  add column if not exists last_item_count integer not null default 0,
  add column if not exists last_error text;

comment on column public.as_news_sources.last_checked_at is 'Last time the AfroStream news monitor attempted to fetch this source.';
comment on column public.as_news_sources.last_success_at is 'Last time the AfroStream news monitor fetched and parsed this source successfully.';
comment on column public.as_news_sources.last_status_code is 'Last HTTP status observed by the AfroStream news monitor.';
comment on column public.as_news_sources.last_item_count is 'Number of RSS or Atom items parsed during the last successful monitor fetch.';
comment on column public.as_news_sources.last_error is 'Most recent monitor fetch or parse error for this source, cleared on success.';
