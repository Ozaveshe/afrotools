-- Behavior-based email automation state for AfroTools.
-- Target instance: AUTH (profiles, email_leads, and account activity tables).

alter table public.profiles
  add column if not exists email_onboarding_nudge_sent_at timestamptz,
  add column if not exists email_activity_milestone_sent_at timestamptz;

alter table public.email_leads
  add column if not exists email_followup_sent_at timestamptz;

create index if not exists idx_profiles_email_onboarding_nudge
  on public.profiles (email_onboarding_nudge_sent_at)
  where email_digest_enabled is true;

create index if not exists idx_profiles_email_activity_milestone
  on public.profiles (email_activity_milestone_sent_at)
  where email_digest_enabled is true;

create index if not exists idx_email_leads_followup_due
  on public.email_leads (first_email_sent_at, email_followup_sent_at)
  where opt_in_digest is true;
