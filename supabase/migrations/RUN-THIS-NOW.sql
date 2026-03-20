-- ============================================================
-- AfroTools: CONSOLIDATED MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Project: zpclagtgczsygrgztlts
-- ============================================================

-- ─── 1. PROFILE COLUMNS ─────────────────────────────────────
-- Adds extended profile fields so Edit Profile can save to DB
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_size text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_level text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_digest_enabled boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Ensure the profiles table has a name and country column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow service_role to bypass RLS (already default, but explicit)
-- Users can read their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Users can update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Users can insert their own profile (for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ─── 2. ALERTS TABLE ────────────────────────────────────────
-- Admin-managed regulatory/tax alerts
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

-- No RLS on alerts — service_role key handles access control in the API

-- ─── 3. FUEL PRICES TABLE ───────────────────────────────────
-- Admin-managed fuel price updates per country
CREATE TABLE IF NOT EXISTS fuel_prices (
  id SERIAL PRIMARY KEY,
  country_code CHAR(2) NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  petrol_usd NUMERIC,
  diesel_usd NUMERIC,
  lpg_usd NUMERIC,
  petrol_change TEXT DEFAULT 'stable',
  diesel_change TEXT DEFAULT 'stable',
  regulated BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT DEFAULT 'admin'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fuel_country ON fuel_prices (country_code);

-- ─── DONE ───────────────────────────────────────────────────
-- After running this, verify:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
--   SELECT * FROM alerts LIMIT 1;
--   SELECT * FROM fuel_prices LIMIT 1;
