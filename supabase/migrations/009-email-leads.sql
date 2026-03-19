-- 009-email-leads.sql
-- Email leads table for PDF gate and other lead capture flows.
-- Stores anonymous user emails separately from auth profiles.

CREATE TABLE IF NOT EXISTS email_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  source text DEFAULT 'pdf-gate',
  tool_slug text,
  opt_in_digest boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON email_leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_source ON email_leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created ON email_leads(created_at);
