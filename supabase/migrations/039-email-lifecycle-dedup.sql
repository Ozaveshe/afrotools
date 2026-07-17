-- Email lifecycle dedupe state.
-- Applied to the AUTH Supabase instance (profiles + email_leads).

alter table if exists public.profiles
  add column if not exists email_welcome_sent_at timestamptz;

create index if not exists idx_profiles_email_welcome_sent
  on public.profiles (email_welcome_sent_at)
  where email_welcome_sent_at is not null;
