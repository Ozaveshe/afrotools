-- Alerts table for admin-managed regulatory/tax alerts
-- Run on DATA instance: jbmhfpkzbgyeodsqhprx.supabase.co

CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_codes TEXT[] NOT NULL DEFAULT '{ALL}',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  effective_date DATE NOT NULL,
  expires_at DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts (active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_alerts_country ON alerts USING GIN (country_codes);
