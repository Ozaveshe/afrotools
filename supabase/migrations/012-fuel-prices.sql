-- Fuel prices table for admin-managed fuel price updates
-- Run on Supabase project: zpclagtgczsygrgztlts.supabase.co

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
