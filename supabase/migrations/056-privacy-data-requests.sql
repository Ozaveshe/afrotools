-- 056-privacy-data-requests.sql
-- Data Subject Access Request (DSAR) ledger for the self-service privacy /
-- GDPR data-request tool (/privacy/data-request/).
--
-- Threat model: this table is written ONLY by the privacy-data-request Netlify
-- function using the service-role key. There are intentionally NO anon policies.
-- Requests move through a double-opt-in verification step (a verification token
-- emailed to the requester) BEFORE they are actioned, so that no one can lodge an
-- access/erasure request against another person's email. Raw IP is never stored;
-- only a salted hash is kept for abuse triage.

CREATE TABLE IF NOT EXISTS privacy_requests (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email              text NOT NULL,
  request_type       text NOT NULL,
  details            text,
  status             text NOT NULL DEFAULT 'pending_verification',
  verification_token text,
  verified_at        timestamptz,
  completed_at       timestamptz,
  handled_by         text,
  resolution_note    text,
  country_code       text,
  source_url         text,
  ip_hash            text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),

  CONSTRAINT privacy_requests_type_check CHECK (
    request_type IN ('access', 'export', 'correction', 'deletion', 'opt_out', 'restrict', 'object', 'other')
  ),
  CONSTRAINT privacy_requests_status_check CHECK (
    status IN ('pending_verification', 'verified', 'in_progress', 'completed', 'rejected', 'expired')
  )
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_email ON privacy_requests (lower(email));
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests (status);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_token ON privacy_requests (verification_token);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_created ON privacy_requests (created_at DESC);

-- RLS: service-role only. No anon INSERT/SELECT/UPDATE — every write comes from
-- the validated, rate-limited privacy-data-request function with the service key.
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_privacy_requests" ON privacy_requests;
CREATE POLICY "service_role_all_privacy_requests"
  ON privacy_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Keep updated_at fresh on every write.
CREATE OR REPLACE FUNCTION set_privacy_requests_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_privacy_requests_updated_at ON privacy_requests;
CREATE TRIGGER trg_privacy_requests_updated_at
  BEFORE UPDATE ON privacy_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_privacy_requests_updated_at();
