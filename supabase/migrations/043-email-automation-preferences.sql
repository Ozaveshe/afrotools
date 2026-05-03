-- Email automation preferences and send-state fields.
-- Applied to the AUTH Supabase instance (profiles).

alter table if exists public.profiles
  add column if not exists email_weekly_enabled boolean not null default true,
  add column if not exists email_last_weekly_at timestamptz,
  add column if not exists email_last_signin_reminder_at timestamptz;

create index if not exists idx_profiles_email_weekly
  on public.profiles (email_weekly_enabled, email_last_weekly_at)
  where email_digest_enabled is true;

create index if not exists idx_profiles_signin_reminder
  on public.profiles (email_last_signin_reminder_at)
  where email_digest_enabled is true;
