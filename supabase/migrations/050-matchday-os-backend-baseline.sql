-- Matchday OS backend baseline.
-- Mirrors the live AfroTools Matchday schema enough for fresh environments,
-- Netlify functions, public leaderboard reads, authenticated prediction writes,
-- referral tracking, anti-cheat review, prize eligibility, and audit logs.

create schema if not exists private;
create extension if not exists pgcrypto;

create or replace function private.matchday_is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'matchday_admin')::boolean, false)
      or coalesce((auth.jwt() -> 'app_metadata' ->> 'admin')::boolean, false);
$$;

create table if not exists public.matchday_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Matchday fan',
  display_name_public boolean not null default true,
  country_code text,
  city text,
  preferred_timezone text not null default 'Africa/Lagos',
  preferred_team_id text,
  team_watchlist jsonb not null default '[]'::jsonb,
  referral_code text not null default ('mdo_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
  referred_by_user_id uuid references auth.users(id),
  email_verified_at timestamptz,
  terms_accepted_at timestamptz,
  contest_terms_version text,
  account_review_status text not null default 'unreviewed',
  duplicate_review_status text not null default 'unreviewed',
  public_profile_status text not null default 'active',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matchday_prediction_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'matchday-os-2026',
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_status text not null default 'active',
  lock_status text not null default 'open',
  terms_accepted_at timestamptz,
  prediction_payload jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent_hash text,
  device_signal_hash text,
  submitted_at timestamptz not null default now(),
  last_saved_at timestamptz not null default now(),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matchday_fixture_predictions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.matchday_prediction_entries(id) on delete cascade,
  campaign_id text not null default 'matchday-os-2026',
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null,
  stage text,
  group_id text,
  home_team_id text,
  away_team_id text,
  kickoff_utc timestamptz,
  lock_deadline_utc timestamptz,
  locked_at timestamptz,
  prediction_type text not null default 'fixture_result',
  result_pick text not null,
  home_score smallint,
  away_score smallint,
  submitted_at timestamptz not null default now(),
  last_saved_at timestamptz not null default now(),
  score_status text not null default 'unscored',
  prediction_points integer not null default 0,
  fan_points_bonus integer not null default 0,
  exact_score_awarded boolean not null default false,
  outcome_awarded boolean not null default false,
  african_team_bonus_awarded boolean not null default false,
  scoring_details jsonb not null default '{}'::jsonb,
  scored_at timestamptz,
  scored_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matchday_fixture_predictions_score_range check (
    (home_score is null or home_score between 0 and 20)
    and (away_score is null or away_score between 0 and 20)
  )
);

create table if not exists public.matchday_leaderboard_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  campaign_id text not null default 'matchday-os-2026',
  prediction_points integer not null default 0,
  fan_points integer not null default 0,
  total_matchday_points integer generated always as (prediction_points + fan_points) stored,
  exact_scores_count integer not null default 0,
  correct_outcomes_count integer not null default 0,
  african_team_predictions_count integer not null default 0,
  rank_position integer,
  previous_rank_position integer,
  rank_delta integer not null default 0,
  rank_movement text not null default 'new',
  score_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matchday_public_leaderboard (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'matchday-os-2026',
  period text not null default 'all_time',
  rank_position integer not null,
  previous_rank_position integer,
  rank_delta integer not null default 0,
  rank_movement text not null default 'new',
  public_display_name text not null,
  public_country_code text,
  public_team_id text,
  prediction_points integer not null default 0,
  fan_points integer not null default 0,
  total_matchday_points integer not null default 0,
  exact_scores_count integer not null default 0,
  correct_outcomes_count integer not null default 0,
  african_team_predictions_count integer not null default 0,
  provisional boolean not null default true,
  verification_status text not null default 'provisional',
  is_prize_rank boolean not null default false,
  prize_rank integer,
  prize_amount_usd numeric,
  score_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matchday_referral_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'matchday-os-2026',
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid references auth.users(id) on delete set null,
  referral_code text,
  event_type text not null,
  referral_source text,
  fan_points_delta integer not null default 0,
  reward_status text not null default 'no_points',
  ip_hash text,
  user_agent_hash text,
  device_signal_hash text,
  risk_flags jsonb not null default '[]'::jsonb,
  flagged boolean not null default false,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  influencer_code text,
  landing_path text,
  share_channel text,
  source_context jsonb not null default '{}'::jsonb,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  constraint matchday_no_self_referral check (referred_user_id is null or referred_user_id <> referrer_user_id)
);

create table if not exists public.matchday_fan_point_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'matchday-os-2026',
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  points integer not null,
  status text not null default 'awarded',
  source text not null default 'matchday-os-api',
  dedupe_key text not null default 'default',
  referral_event_id uuid references public.matchday_referral_events(id) on delete set null,
  ip_hash text,
  user_agent_hash text,
  device_signal_hash text,
  risk_flags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id, event_type, dedupe_key)
);

create table if not exists public.matchday_anti_cheat_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'matchday-os-2026',
  user_id uuid references auth.users(id) on delete set null,
  entry_id uuid references public.matchday_prediction_entries(id) on delete set null,
  referral_event_id uuid references public.matchday_referral_events(id) on delete set null,
  event_type text not null,
  severity text not null default 'info',
  signal_type text,
  ip_hash text,
  user_agent_hash text,
  device_signal_hash text,
  signal_digest text,
  details jsonb not null default '{}'::jsonb,
  review_status text not null default 'new',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.matchday_prize_eligibility (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'matchday-os-2026',
  user_id uuid not null references auth.users(id) on delete cascade,
  eligibility_status text not null default 'needs_verification',
  verification_status text not null default 'not_started',
  payout_status text not null default 'not_started',
  payout_method_preference text,
  payout_identity_hash text,
  payout_identity_status text not null default 'not_collected',
  payout_method_risk text not null default 'not_reviewed',
  payout_review_flags jsonb not null default '[]'::jsonb,
  risk_score numeric not null default 0,
  risk_flags jsonb not null default '[]'::jsonb,
  review_reason text,
  last_flagged_at timestamptz,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create table if not exists public.matchday_review_queue (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'matchday-os-2026',
  user_id uuid references auth.users(id) on delete set null,
  entry_id uuid references public.matchday_prediction_entries(id) on delete set null,
  eligibility_id uuid references public.matchday_prize_eligibility(id) on delete set null,
  anti_cheat_event_id uuid references public.matchday_anti_cheat_events(id) on delete set null,
  referral_event_id uuid references public.matchday_referral_events(id) on delete set null,
  queue_type text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  reason_code text not null,
  risk_flags jsonb not null default '[]'::jsonb,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  assigned_to uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matchday_audit_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'matchday-os-2026',
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  target_table text not null,
  target_id uuid,
  reason text,
  before_state jsonb,
  after_state jsonb,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.matchday_admin_notes (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'matchday-os-2026',
  target_table text not null,
  target_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  entry_id uuid references public.matchday_prediction_entries(id) on delete set null,
  review_queue_id uuid references public.matchday_review_queue(id) on delete set null,
  note_type text not null default 'operator_note',
  visibility text not null default 'admin_internal',
  note text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matchday_growth_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'matchday-os-2026',
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  source_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  influencer_code text,
  share_channel text,
  session_hash text,
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  suspicious boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.matchday_influencer_codes (
  code text primary key,
  campaign_id text not null default 'matchday-os-2026',
  label text not null,
  owner_contact text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.matchday_daily_marketing_rollups (
  activity_date date,
  campaign_id text,
  event_type text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  influencer_code text,
  share_channel text,
  event_count integer,
  unique_session_count integer,
  authenticated_user_count integer,
  suspicious_event_count integer,
  last_event_at timestamptz
);

create index if not exists matchday_fixture_predictions_user_idx on public.matchday_fixture_predictions(user_id, campaign_id);
create index if not exists matchday_fixture_predictions_match_idx on public.matchday_fixture_predictions(match_id);
create index if not exists matchday_public_leaderboard_rank_idx on public.matchday_public_leaderboard(campaign_id, period, rank_position);
create index if not exists matchday_referral_events_referrer_idx on public.matchday_referral_events(referrer_user_id, campaign_id);
create index if not exists matchday_anti_cheat_user_idx on public.matchday_anti_cheat_events(user_id, campaign_id);
create index if not exists matchday_review_queue_status_idx on public.matchday_review_queue(status, severity, created_at);

alter table public.matchday_profiles enable row level security;
alter table public.matchday_prediction_entries enable row level security;
alter table public.matchday_fixture_predictions enable row level security;
alter table public.matchday_leaderboard_scores enable row level security;
alter table public.matchday_public_leaderboard enable row level security;
alter table public.matchday_referral_events enable row level security;
alter table public.matchday_fan_point_events enable row level security;
alter table public.matchday_anti_cheat_events enable row level security;
alter table public.matchday_prize_eligibility enable row level security;
alter table public.matchday_review_queue enable row level security;
alter table public.matchday_audit_logs enable row level security;
alter table public.matchday_admin_notes enable row level security;
alter table public.matchday_growth_events enable row level security;
alter table public.matchday_influencer_codes enable row level security;

drop policy if exists "Anyone can read public Matchday leaderboard rows" on public.matchday_public_leaderboard;
create policy "Anyone can read public Matchday leaderboard rows"
on public.matchday_public_leaderboard for select
to anon, authenticated
using (true);

drop policy if exists "Users can manage own Matchday profile" on public.matchday_profiles;
create policy "Users can manage own Matchday profile"
on public.matchday_profiles for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own Matchday entries" on public.matchday_prediction_entries;
create policy "Users can read own Matchday entries"
on public.matchday_prediction_entries for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own unlocked Matchday entries" on public.matchday_prediction_entries;
create policy "Users can insert own unlocked Matchday entries"
on public.matchday_prediction_entries for insert
to authenticated
with check (auth.uid() = user_id and locked_at is null);

drop policy if exists "Users can update own unlocked Matchday entries" on public.matchday_prediction_entries;
create policy "Users can update own unlocked Matchday entries"
on public.matchday_prediction_entries for update
to authenticated
using (auth.uid() = user_id and locked_at is null)
with check (auth.uid() = user_id and locked_at is null);

drop policy if exists "Users can manage own unlocked fixture predictions" on public.matchday_fixture_predictions;
create policy "Users can manage own unlocked fixture predictions"
on public.matchday_fixture_predictions for all
to authenticated
using (auth.uid() = user_id and locked_at is null)
with check (auth.uid() = user_id and locked_at is null);

drop policy if exists "Users can read own Matchday leaderboard score" on public.matchday_leaderboard_scores;
create policy "Users can read own Matchday leaderboard score"
on public.matchday_leaderboard_scores for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own Matchday referrals" on public.matchday_referral_events;
create policy "Users can read own Matchday referrals"
on public.matchday_referral_events for select
to authenticated
using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

drop policy if exists "Users can insert own non-award referral events" on public.matchday_referral_events;
create policy "Users can insert own non-award referral events"
on public.matchday_referral_events for insert
to authenticated
with check (auth.uid() = referrer_user_id and fan_points_delta = 0 and reward_status = 'no_points');

drop policy if exists "Users can read own Matchday prize eligibility" on public.matchday_prize_eligibility;
create policy "Users can read own Matchday prize eligibility"
on public.matchday_prize_eligibility for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own Matchday Fan Points" on public.matchday_fan_point_events;
create policy "Users can read own Matchday Fan Points"
on public.matchday_fan_point_events for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own Matchday growth events" on public.matchday_growth_events;
create policy "Users can read own Matchday growth events"
on public.matchday_growth_events for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Matchday admins can manage profiles" on public.matchday_profiles;
create policy "Matchday admins can manage profiles" on public.matchday_profiles for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can manage entries" on public.matchday_prediction_entries;
create policy "Matchday admins can manage entries" on public.matchday_prediction_entries for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can manage fixture predictions" on public.matchday_fixture_predictions;
create policy "Matchday admins can manage fixture predictions" on public.matchday_fixture_predictions for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can manage leaderboard scores" on public.matchday_leaderboard_scores;
create policy "Matchday admins can manage leaderboard scores" on public.matchday_leaderboard_scores for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can manage public leaderboard rows" on public.matchday_public_leaderboard;
create policy "Matchday admins can manage public leaderboard rows" on public.matchday_public_leaderboard for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can manage referral events" on public.matchday_referral_events;
create policy "Matchday admins can manage referral events" on public.matchday_referral_events for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can manage Fan Points" on public.matchday_fan_point_events;
create policy "Matchday admins can manage Fan Points" on public.matchday_fan_point_events for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can manage anti-cheat events" on public.matchday_anti_cheat_events;
create policy "Matchday admins can manage anti-cheat events" on public.matchday_anti_cheat_events for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can manage prize eligibility" on public.matchday_prize_eligibility;
create policy "Matchday admins can manage prize eligibility" on public.matchday_prize_eligibility for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can manage review queue" on public.matchday_review_queue;
create policy "Matchday admins can manage review queue" on public.matchday_review_queue for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can read audit logs" on public.matchday_audit_logs;
create policy "Matchday admins can read audit logs" on public.matchday_audit_logs for select to authenticated using (private.matchday_is_admin());
drop policy if exists "Matchday admins can insert audit logs" on public.matchday_audit_logs;
create policy "Matchday admins can insert audit logs" on public.matchday_audit_logs for insert to authenticated with check (private.matchday_is_admin());
drop policy if exists "Matchday admins can manage admin notes" on public.matchday_admin_notes;
create policy "Matchday admins can manage admin notes" on public.matchday_admin_notes for all to authenticated using (private.matchday_is_admin()) with check (private.matchday_is_admin());
