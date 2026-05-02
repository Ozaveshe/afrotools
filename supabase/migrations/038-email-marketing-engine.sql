-- 038: Email marketing engine fields
-- Adds the missing profile digest fields and lead lifecycle state used by
-- Resend-backed signup, PDF lead, unsubscribe, and monthly digest flows.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_last_digest_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_unsubscribe_token uuid DEFAULT gen_random_uuid();

UPDATE public.profiles
SET email_unsubscribe_token = gen_random_uuid()
WHERE email_unsubscribe_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unsubscribe_token
ON public.profiles (email_unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_profiles_digest
ON public.profiles (email_digest_enabled, email_last_digest_at)
WHERE email_digest_enabled = true;

ALTER TABLE public.email_leads
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS first_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_status text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS email_error text,
  ADD COLUMN IF NOT EXISTS email_unsubscribe_token uuid DEFAULT gen_random_uuid();

UPDATE public.email_leads
SET email_unsubscribe_token = gen_random_uuid()
WHERE email_unsubscribe_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_leads_unsubscribe_token
ON public.email_leads (email_unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_email_leads_status
ON public.email_leads (email_status, opt_in_digest, created_at);
