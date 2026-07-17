-- 010-api-keys.sql
-- API key management for the AfroTools public API
-- Note: V1 uses Netlify Blobs for key storage (api-keys.js).
-- This table provides a durable SQL-backed alternative for analytics,
-- migration from Blobs, and future Supabase-native auth.

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key text UNIQUE NOT NULL,
  email text NOT NULL,
  name text,
  use_case text,
  tier text DEFAULT 'free',
  requests_today int DEFAULT 0,
  requests_total int DEFAULT 0,
  last_request_at timestamptz,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

CREATE INDEX idx_api_keys_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_email ON api_keys(email);
