-- ============================================================
-- AfroJAMB schema
-- 11 subjects, ~16k questions, CBT attempts, streaks, leaderboards
-- Run on the data instance: jbmhfpkzbgyeodsqhprx.supabase.co
-- ============================================================

-- ---- Question bank ----
create table if not exists jamb_questions (
  id text primary key,                    -- e.g. "biology-2018-12-abc123"
  subject text not null,                  -- 'biology' | 'mathematics' | ...
  year integer,                           -- 1978..2025 (nullable)
  num integer not null,                   -- original question number
  question text not null,
  options jsonb not null,                 -- {"A": "...", "B": "...", "C": "...", "D": "..."}
  answer text,                            -- 'A' | 'B' | 'C' | 'D' | 'E' | null
  format integer not null default 4,      -- 4 (modern CBT) or 5 (legacy)
  has_diagram boolean not null default false,
  diagram_url text,                       -- /data/jamb/diagrams/{subject}/{id}.svg
  topic text,                             -- e.g. 'Algebra' | 'Genetics' | nullable
  difficulty text,                        -- 'easy' | 'medium' | 'hard' | null
  ai_explanation text,                    -- cached AI tutor explanation
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_jq_subject_year on jamb_questions(subject, year);
create index if not exists idx_jq_subject_topic on jamb_questions(subject, topic);
create index if not exists idx_jq_format on jamb_questions(format);
create index if not exists idx_jq_has_answer on jamb_questions((answer is not null));
create index if not exists idx_jq_question_fts on jamb_questions using gin (to_tsvector('english', question));

-- ---- CBT attempts (full mock + topic drills + quick quiz) ----
create table if not exists jamb_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,                           -- nullable for anonymous
  anon_session text,                      -- localStorage uuid for anon
  mode text not null,                     -- 'cbt-full' | 'topic-drill' | 'quick-quiz' | 'past-paper'
  subjects text[],                        -- ['english','mathematics','physics','biology']
  question_ids text[],                    -- frozen list at start
  answers jsonb,                          -- {"q-id": "B", ...}
  score integer,                          -- 0..400 for full CBT
  subject_scores jsonb,                   -- {"english": 65, "mathematics": 80, ...}
  duration_seconds integer,
  started_at timestamptz default now(),
  finished_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_ja_user on jamb_attempts(user_id);
create index if not exists idx_ja_anon on jamb_attempts(anon_session);
create index if not exists idx_ja_mode on jamb_attempts(mode);
create index if not exists idx_ja_started on jamb_attempts(started_at desc);

-- ---- Per-question stats (powers pattern analyzer + leaderboards) ----
create table if not exists jamb_question_stats (
  question_id text primary key references jamb_questions(id) on delete cascade,
  total_attempts integer default 0,
  correct_count integer default 0,
  avg_seconds numeric default 0,
  last_seen timestamptz default now()
);

-- ---- Streaks (Duolingo-style) ----
create table if not exists jamb_streaks (
  user_id uuid primary key,
  current_streak integer default 0,
  best_streak integer default 0,
  last_active_date date,
  total_questions integer default 0,
  total_correct integer default 0,
  total_minutes integer default 0,
  updated_at timestamptz default now()
);

-- ---- Flashcard decks + reviews (SRS) ----
create table if not exists jamb_flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  anon_session text,
  question_id text,                       -- if generated from a past question
  subject text not null,
  front text not null,
  back text not null,
  -- SM-2 SRS state
  ease numeric default 2.5,
  interval_days integer default 0,
  repetitions integer default 0,
  due_date date default current_date,
  created_at timestamptz default now()
);

create index if not exists idx_jf_user on jamb_flashcards(user_id);
create index if not exists idx_jf_anon on jamb_flashcards(anon_session);
create index if not exists idx_jf_due on jamb_flashcards(due_date);

-- ---- Study plans (personalized) ----
create table if not exists jamb_study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  anon_session text,
  exam_date date not null,
  subjects text[] not null,
  hours_per_day numeric default 2,
  weak_topics jsonb default '[]'::jsonb,
  generated_plan jsonb,                   -- day-by-day schedule
  current_day integer default 1,
  created_at timestamptz default now()
);

-- ---- Public leaderboard (top mock scores) ----
create or replace view jamb_leaderboard as
select
  a.user_id,
  a.anon_session,
  max(a.score) as best_score,
  count(*) as attempts,
  max(a.finished_at) as last_attempt
from jamb_attempts a
where a.mode = 'cbt-full'
  and a.score is not null
  and a.finished_at is not null
group by a.user_id, a.anon_session
order by best_score desc nulls last;

-- ---- AI tutor cache (avoid re-generating explanations) ----
create table if not exists jamb_ai_cache (
  cache_key text primary key,             -- hash(question_id + prompt_type)
  question_id text,
  prompt_type text,                       -- 'explain' | 'why-wrong' | 'similar'
  response text not null,
  model text,
  tokens_used integer,
  created_at timestamptz default now()
);

create index if not exists idx_jaic_qid on jamb_ai_cache(question_id);

-- ---- Daily question subscribers (WhatsApp/email) ----
create table if not exists jamb_daily_subscribers (
  id uuid primary key default gen_random_uuid(),
  contact text not null unique,           -- phone or email
  channel text not null check (channel in ('whatsapp','email')),
  subjects text[],
  send_hour smallint default 8 check (send_hour between 0 and 23),
  active boolean default true,
  created_at timestamptz default now()
);

-- ---- RLS policies (anonymous-friendly) ----
alter table jamb_questions enable row level security;
alter table jamb_attempts enable row level security;
alter table jamb_question_stats enable row level security;
alter table jamb_streaks enable row level security;
alter table jamb_flashcards enable row level security;
alter table jamb_study_plans enable row level security;
alter table jamb_ai_cache enable row level security;
alter table jamb_daily_subscribers enable row level security;

-- Public read on questions
drop policy if exists "Public read questions" on jamb_questions;
create policy "Public read questions" on jamb_questions for select using (true);

-- Public read stats
drop policy if exists "Public read stats" on jamb_question_stats;
create policy "Public read stats" on jamb_question_stats for select using (true);

-- Public insert/select attempts (anonymous + auth)
drop policy if exists "Public attempts insert" on jamb_attempts;
create policy "Public attempts insert" on jamb_attempts for insert with check (true);
drop policy if exists "Own attempts read" on jamb_attempts;
create policy "Own attempts read" on jamb_attempts for select using (
  auth.uid() = user_id or anon_session is not null
);

-- Streaks: own only
drop policy if exists "Own streaks" on jamb_streaks;
create policy "Own streaks" on jamb_streaks for all using (auth.uid() = user_id);

-- Flashcards: own + anon
drop policy if exists "Own flashcards" on jamb_flashcards;
create policy "Own flashcards" on jamb_flashcards for all using (
  auth.uid() = user_id or anon_session is not null
);

-- AI cache: public read (cached responses are non-sensitive)
drop policy if exists "Public ai cache read" on jamb_ai_cache;
create policy "Public ai cache read" on jamb_ai_cache for select using (true);
drop policy if exists "Service ai cache write" on jamb_ai_cache;
create policy "Service ai cache write" on jamb_ai_cache for insert with check (true);

-- Done.
