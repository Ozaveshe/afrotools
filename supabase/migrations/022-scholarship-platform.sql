-- Scholarship platform layer for Scholarship Finder and Education Hub
-- Target instance: AUTH - zpclagtgczsygrgztlts.supabase.co

create table if not exists public.scholarship_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  name text not null,
  source_type text not null check (source_type in ('official_page', 'rss', 'api', 'curated_import', 'permitted_scrape')),
  base_url text,
  active boolean not null default true,
  cadence text not null default 'daily',
  parser_key text not null,
  country_scope text[] not null default '{}'::text[],
  destination_scope text[] not null default '{}'::text[],
  trust_level text not null default 'platform',
  last_success_at timestamptz,
  last_error_at timestamptz,
  robots_or_policy_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scholarship_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.scholarship_sources(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  items_seen integer not null default 0,
  items_created integer not null default 0,
  items_updated integer not null default 0,
  error_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.scholarship_raw_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.scholarship_sources(id) on delete cascade,
  fetched_at timestamptz not null default now(),
  source_url text,
  raw_hash text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  parse_status text not null default 'parsed' check (parse_status in ('parsed', 'skipped', 'failed')),
  normalized_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, raw_hash)
);

create table if not exists public.scholarships (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  provider text,
  source_url text,
  official_url text,
  destination_countries text[] not null default '{}'::text[],
  eligible_origins text[] not null default array['Africa']::text[],
  study_levels text[] not null default '{}'::text[],
  fields text[] not null default '{}'::text[],
  funding_type text,
  min_gpa numeric,
  min_ielts numeric,
  deadline_date date,
  deadline_text text,
  status text not null default 'unclear' check (status in ('open', 'upcoming', 'unclear', 'closed')),
  confidence_mode text not null default 'curated' check (confidence_mode in ('live', 'cached', 'curated', 'fallback')),
  proof_level text not null default 'official_link',
  summary text,
  last_seen_at timestamptz not null default now(),
  last_verified_at timestamptz,
  last_source_id uuid references public.scholarship_sources(id) on delete set null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  raw_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_saved_scholarships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  saved_at timestamptz not null default now(),
  note text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scholarship_id)
);

create table if not exists public.user_scholarship_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  reminder_type text not null default 'deadline' check (reminder_type in ('deadline', 'weekly_digest', 'status_change')),
  offsets integer[] not null default array[30, 14, 7, 1, 0],
  enabled boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scholarship_id, reminder_type)
);

create table if not exists public.scholarship_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null default 'deadline_reminder' check (job_type in ('deadline_reminder', 'weekly_digest', 'status_change')),
  user_id uuid not null references auth.users(id) on delete cascade,
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  reminder_id uuid references public.user_scholarship_reminders(id) on delete cascade,
  scheduled_for timestamptz not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'failed', 'cancelled', 'skipped')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (reminder_id, scheduled_for, job_type)
);

create table if not exists public.scholarship_notification_log (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.scholarship_notification_jobs(id) on delete cascade,
  sent_at timestamptz not null default now(),
  provider_status text,
  error_summary text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists idx_scholarship_sources_active on public.scholarship_sources(active);
create index if not exists idx_scholarship_sources_parser_key on public.scholarship_sources(parser_key);
create index if not exists idx_scholarship_ingest_runs_source_started on public.scholarship_ingest_runs(source_id, started_at desc);
create index if not exists idx_scholarship_raw_items_source_fetched on public.scholarship_raw_items(source_id, fetched_at desc);
create index if not exists idx_scholarships_active_deadline on public.scholarships(is_active, deadline_date);
create index if not exists idx_scholarships_last_seen on public.scholarships(last_seen_at desc);
create index if not exists idx_scholarships_confidence_mode on public.scholarships(confidence_mode);
create index if not exists idx_user_saved_scholarships_user_archived on public.user_saved_scholarships(user_id, archived, updated_at desc);
create index if not exists idx_user_scholarship_reminders_user_enabled on public.user_scholarship_reminders(user_id, enabled);
create index if not exists idx_scholarship_notification_jobs_status_schedule on public.scholarship_notification_jobs(status, scheduled_for);
create index if not exists idx_scholarship_notification_jobs_user on public.scholarship_notification_jobs(user_id, scheduled_for desc);

drop trigger if exists scholarship_sources_updated_at on public.scholarship_sources;
create trigger scholarship_sources_updated_at
before update on public.scholarship_sources
for each row execute function public.update_updated_at();

drop trigger if exists scholarship_raw_items_updated_at on public.scholarship_raw_items;
create trigger scholarship_raw_items_updated_at
before update on public.scholarship_raw_items
for each row execute function public.update_updated_at();

drop trigger if exists scholarships_updated_at on public.scholarships;
create trigger scholarships_updated_at
before update on public.scholarships
for each row execute function public.update_updated_at();

drop trigger if exists user_saved_scholarships_updated_at on public.user_saved_scholarships;
create trigger user_saved_scholarships_updated_at
before update on public.user_saved_scholarships
for each row execute function public.update_updated_at();

drop trigger if exists user_scholarship_reminders_updated_at on public.user_scholarship_reminders;
create trigger user_scholarship_reminders_updated_at
before update on public.user_scholarship_reminders
for each row execute function public.update_updated_at();

drop trigger if exists scholarship_notification_jobs_updated_at on public.scholarship_notification_jobs;
create trigger scholarship_notification_jobs_updated_at
before update on public.scholarship_notification_jobs
for each row execute function public.update_updated_at();

alter table public.scholarship_sources enable row level security;
alter table public.scholarship_ingest_runs enable row level security;
alter table public.scholarship_raw_items enable row level security;
alter table public.scholarships enable row level security;
alter table public.user_saved_scholarships enable row level security;
alter table public.user_scholarship_reminders enable row level security;
alter table public.scholarship_notification_jobs enable row level security;
alter table public.scholarship_notification_log enable row level security;

drop policy if exists "Anyone can read active scholarships" on public.scholarships;
create policy "Anyone can read active scholarships"
on public.scholarships
for select
using (is_active = true);

drop policy if exists "Users can read own saved scholarships" on public.user_saved_scholarships;
create policy "Users can read own saved scholarships"
on public.user_saved_scholarships
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved scholarships" on public.user_saved_scholarships;
create policy "Users can insert own saved scholarships"
on public.user_saved_scholarships
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved scholarships" on public.user_saved_scholarships;
create policy "Users can update own saved scholarships"
on public.user_saved_scholarships
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved scholarships" on public.user_saved_scholarships;
create policy "Users can delete own saved scholarships"
on public.user_saved_scholarships
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own scholarship reminders" on public.user_scholarship_reminders;
create policy "Users can read own scholarship reminders"
on public.user_scholarship_reminders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own scholarship reminders" on public.user_scholarship_reminders;
create policy "Users can insert own scholarship reminders"
on public.user_scholarship_reminders
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own scholarship reminders" on public.user_scholarship_reminders;
create policy "Users can update own scholarship reminders"
on public.user_scholarship_reminders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own scholarship reminders" on public.user_scholarship_reminders;
create policy "Users can delete own scholarship reminders"
on public.user_scholarship_reminders
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own scholarship notification jobs" on public.scholarship_notification_jobs;
create policy "Users can read own scholarship notification jobs"
on public.scholarship_notification_jobs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own scholarship notification log" on public.scholarship_notification_log;
create policy "Users can read own scholarship notification log"
on public.scholarship_notification_log
for select
to authenticated
using (
  exists (
    select 1
    from public.scholarship_notification_jobs jobs
    where jobs.id = scholarship_notification_log.job_id
      and jobs.user_id = auth.uid()
  )
);

insert into public.scholarship_sources (
  source_key,
  name,
  source_type,
  base_url,
  active,
  cadence,
  parser_key,
  country_scope,
  destination_scope,
  trust_level,
  robots_or_policy_note
)
values
  (
    'afrotools-data-catalog',
    'AfroTools scholarship catalog import',
    'api',
    'internal:data-instance-scholarships',
    true,
    'daily',
    'data_instance_scholarship_catalog',
    array['ALL'],
    array['global'],
    'platform',
    'Internal structured import from the AfroTools scholarship data catalog.'
  ),
  (
    'afrotools-curated-backup',
    'AfroTools curated scholarship backup',
    'curated_import',
    'repo:education-scholarship-feed-fallback',
    false,
    'manual',
    'curated_backup_catalog',
    array['ALL'],
    array['global'],
    'curated',
    'Repo-backed fallback catalog used when the live scholarship pipeline is unavailable.'
  )
on conflict (source_key) do update
set name = excluded.name,
    source_type = excluded.source_type,
    base_url = excluded.base_url,
    active = excluded.active,
    cadence = excluded.cadence,
    parser_key = excluded.parser_key,
    country_scope = excluded.country_scope,
    destination_scope = excluded.destination_scope,
    trust_level = excluded.trust_level,
    robots_or_policy_note = excluded.robots_or_policy_note,
    updated_at = now();
