-- 008: Email digest preferences
-- Adds columns for monthly email digest opt-in and unsubscribe token

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_digest_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_last_digest_at timestamptz,
ADD COLUMN IF NOT EXISTS email_unsubscribe_token uuid DEFAULT gen_random_uuid();

-- Index for efficient batch digest queries
CREATE INDEX IF NOT EXISTS idx_profiles_digest
ON profiles (email_digest_enabled, email_last_digest_at)
WHERE email_digest_enabled = true;
