-- Consolidate the last active AfroTools surfaces onto the AUTH project.
-- Target: zpclagtgczsygrgztlts (AUTH / canonical AfroTools project)
-- The retired legacy DATA project must not receive this migration.

create table if not exists public.search_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  results_count integer not null default 0,
  source text not null default 'navbar',
  country_code text,
  page_url text,
  session_id text,
  created_at timestamptz default now()
);

create index if not exists idx_search_queries_query on public.search_queries (query);
create index if not exists idx_search_queries_results_count on public.search_queries (results_count);
create index if not exists idx_search_queries_created_at on public.search_queries (created_at desc);

create table if not exists public.education_gpa_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grading_system text not null default 'nigerian_federal',
  semesters jsonb not null default '[]'::jsonb,
  cgpa decimal(4,2),
  total_credits integer default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id)
);

create table if not exists public.education_flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_name text not null,
  cards jsonb not null default '[]'::jsonb,
  card_count integer default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, deck_name)
);

create table if not exists public.education_study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_name text not null default 'My Plan',
  subjects jsonb not null default '[]'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  timetable jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, plan_name)
);

create index if not exists idx_gpa_records_user on public.education_gpa_records (user_id);
create index if not exists idx_flashcard_decks_user on public.education_flashcard_decks (user_id);
create index if not exists idx_study_plans_user on public.education_study_plans (user_id);

create table if not exists public.creator_voice_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  voice_data jsonb not null default '{}'::jsonb,
  example_texts jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

create table if not exists public.creator_mind_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text default 'Untitled',
  project_type text not null check (project_type in (
    'caption', 'thread', 'script', 'hook', 'bio', 'pitch',
    'brief_decode', 'response', 'product_desc', 'repurpose',
    'campaign', 'freeform'
  )),
  input_data jsonb not null default '{}'::jsonb,
  platform text,
  is_favorite boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.creator_mind_outputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creator_mind_projects(id) on delete cascade,
  content text not null,
  variant_label text,
  is_selected boolean default false,
  sent_to_calendar boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_mind_user_type on public.creator_mind_projects (user_id, project_type);
create index if not exists idx_mind_user_date on public.creator_mind_projects (user_id, created_at desc);
create index if not exists idx_mind_outputs_project on public.creator_mind_outputs (project_id);

create table if not exists public.jamb_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anon_session text,
  mode text not null,
  subjects text[],
  question_ids text[],
  answers jsonb,
  score integer,
  subject_scores jsonb,
  duration_seconds integer,
  started_at timestamptz default now(),
  finished_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_ja_user on public.jamb_attempts (user_id);
create index if not exists idx_ja_anon on public.jamb_attempts (anon_session);
create index if not exists idx_ja_mode on public.jamb_attempts (mode);
create index if not exists idx_ja_started on public.jamb_attempts (started_at desc);

create table if not exists public.jamb_daily_subscribers (
  id uuid primary key default gen_random_uuid(),
  contact text not null unique,
  channel text not null check (channel in ('whatsapp', 'email')),
  subjects text[],
  send_hour smallint default 8 check (send_hour between 0 and 23),
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.wb_conversations (
  id uuid primary key default gen_random_uuid(),
  phone_hash text not null unique,
  country_code text,
  first_message_at timestamptz default now(),
  last_message_at timestamptz default now(),
  message_count integer default 1
);

create table if not exists public.wb_usage_log (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.wb_conversations(id) on delete set null,
  intent_type text,
  country_code text,
  success boolean default true,
  response_time_ms integer,
  created_at timestamptz default now()
);

create index if not exists idx_wb_conversations_phone_hash on public.wb_conversations (phone_hash);
create index if not exists idx_wb_usage_log_created_at on public.wb_usage_log (created_at desc);
create index if not exists idx_wb_usage_log_intent_type on public.wb_usage_log (intent_type);

alter table public.search_queries enable row level security;
alter table public.education_gpa_records enable row level security;
alter table public.education_flashcard_decks enable row level security;
alter table public.education_study_plans enable row level security;
alter table public.creator_voice_profiles enable row level security;
alter table public.creator_mind_projects enable row level security;
alter table public.creator_mind_outputs enable row level security;
alter table public.jamb_attempts enable row level security;
alter table public.jamb_daily_subscribers enable row level security;
alter table public.wb_conversations enable row level security;
alter table public.wb_usage_log enable row level security;

drop policy if exists "Users can manage own GPA records" on public.education_gpa_records;
create policy "Users can manage own GPA records"
  on public.education_gpa_records for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own flashcard decks" on public.education_flashcard_decks;
create policy "Users can manage own flashcard decks"
  on public.education_flashcard_decks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own study plans" on public.education_study_plans;
create policy "Users can manage own study plans"
  on public.education_study_plans for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "JAMB attempts insert" on public.jamb_attempts;
create policy "JAMB attempts insert"
  on public.jamb_attempts for insert to anon, authenticated
  with check (
    (auth.uid() is null and user_id is null and anon_session is not null)
    or auth.uid() = user_id
  );

drop policy if exists "JAMB users read own attempts" on public.jamb_attempts;
create policy "JAMB users read own attempts"
  on public.jamb_attempts for select to authenticated
  using (auth.uid() = user_id);

comment on table public.search_queries is 'Server-captured product search telemetry. No raw sensitive user content.';
comment on table public.creator_voice_profiles is 'Private creator voice profiles. Server access only; RLS has no client policy.';
comment on table public.jamb_daily_subscribers is 'Private Daily Question contacts. Service-role access only.';
comment on table public.wb_conversations is 'Hashed WhatsApp conversation metadata. Service-role access only.';
