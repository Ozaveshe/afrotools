-- 013-enriched-email-leads.sql
-- Email leads table with full attribution, segmentation, and lifecycle marketing data.
-- Replaces the original 009-email-leads.sql with enriched columns.

CREATE TABLE IF NOT EXISTS email_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'pdf-gate',
  tool_slug TEXT,
  opt_in_digest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Enriched: context from tool
  country_code TEXT,            -- ISO 3166-1 alpha-2 (from tool context)
  currency TEXT,                -- ISO 4217 (from tool context)

  -- Enriched: attribution
  referrer_url TEXT,            -- document.referrer at capture time
  utm_source TEXT,              -- from URL params
  utm_medium TEXT,              -- from URL params
  utm_campaign TEXT,            -- from URL params
  utm_content TEXT,             -- from URL params
  page_url TEXT,                -- full URL where lead was captured

  -- Enriched: device
  device_type TEXT,             -- 'mobile' | 'tablet' | 'desktop'

  -- Enriched: user profile (optional fields from form)
  name TEXT,
  company TEXT,
  role TEXT,
  industry TEXT,                -- Technology, Finance/Banking, etc.
  company_size TEXT,            -- '1-10' | '11-50' | '51-200' | '201-500' | '500+'

  -- Enriched: lead scoring
  conversion_value NUMERIC,    -- gross salary or primary input value

  UNIQUE(email)
);

-- Indexes for segmentation queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON email_leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_source ON email_leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created ON email_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_country ON email_leads(country_code);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON email_leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON email_leads(industry);

-- RLS: anonymous users can INSERT only, service_role can SELECT
ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_leads" ON email_leads
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "service_select_leads" ON email_leads
  FOR SELECT TO service_role
  USING (true);

CREATE POLICY "service_all_leads" ON email_leads
  FOR ALL TO service_role
  USING (true);
