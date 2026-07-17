-- AfroPoints payout profile details
-- Keeps contributor payout preference details in Supabase instead of treating
-- the selected payout rail as a device-only or one-time cashout value.

ALTER TABLE public.points_profiles
  ADD COLUMN IF NOT EXISTS payout_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payout_details_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.points_profiles.payout_details IS
  'Contributor payout preference details captured during AfroPoints profile setup. Account-only, not public leaderboard data.';

COMMENT ON COLUMN public.points_profiles.payout_details_updated_at IS
  'Last time the contributor updated saved payout details.';
