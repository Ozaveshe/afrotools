-- ============================================================
-- AfroTools Live Data Schema
-- Run this in the Supabase SQL editor (zpclagtgczsygrgztlts)
-- ============================================================

-- ── 1. COMMODITY PRICES ─────────────────────────────────────
-- Covers: maize, rice, sorghum, millet, cowpea, cassava,
--         cocoa, coffee, sesame, groundnut, wheat
-- 20 countries × 11 commodities
CREATE TABLE IF NOT EXISTS commodity_prices (
  id           SERIAL PRIMARY KEY,
  country_code CHAR(2)  NOT NULL,
  country_name TEXT     NOT NULL,
  commodity    TEXT     NOT NULL,   -- 'maize','rice','sorghum', etc.
  currency     TEXT     NOT NULL,
  market       TEXT,
  price        NUMERIC,             -- current price in local currency
  month_ago    NUMERIC,             -- price one month ago
  year_ago     NUMERIC,             -- price one year ago
  trend        TEXT     DEFAULT 'stable', -- 'rising','declining','stable','elevated'
  notes        TEXT,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  updated_by   TEXT     DEFAULT 'admin',
  UNIQUE (country_code, commodity)
);
CREATE INDEX IF NOT EXISTS idx_cp_commodity    ON commodity_prices (commodity);
CREATE INDEX IF NOT EXISTS idx_cp_country_code ON commodity_prices (country_code);

-- Global benchmarks per commodity (one row per commodity)
CREATE TABLE IF NOT EXISTS commodity_benchmarks (
  id        SERIAL PRIMARY KEY,
  commodity TEXT UNIQUE NOT NULL,
  exchange  TEXT,               -- e.g. 'SAFEX (JSE)'
  price_usd NUMERIC,
  notes     TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. COCOA PRICES ─────────────────────────────────────────
-- CI, GH, NG, CM, TG, SL (6 major producers)
CREATE TABLE IF NOT EXISTS cocoa_prices (
  id                      SERIAL PRIMARY KEY,
  country_code            CHAR(2) UNIQUE NOT NULL,
  country_name            TEXT    NOT NULL,
  currency                TEXT    NOT NULL,
  farm_gate_per_kg        NUMERIC,   -- local currency per kg
  export_price_per_kg_usd NUMERIC,   -- USD per kg
  avg_yield_kg_ha         NUMERIC,
  grade1_premium_pct      NUMERIC    DEFAULT 0,
  grade2_discount_pct     NUMERIC    DEFAULT 0,
  rainforest_premium_pct  NUMERIC    DEFAULT 0,
  fairtrade_premium_pct   NUMERIC    DEFAULT 0,
  organic_premium_pct     NUMERIC    DEFAULT 0,
  notes                   TEXT,
  updated_at              TIMESTAMPTZ DEFAULT now(),
  updated_by              TEXT        DEFAULT 'admin'
);

-- ── 3. COFFEE PRICES ────────────────────────────────────────
-- ET, KE, TZ, UG, RW, BI, CD, CI (8 countries, multiple grades each)
CREATE TABLE IF NOT EXISTS coffee_prices (
  id                      SERIAL PRIMARY KEY,
  country_code            CHAR(2) NOT NULL,
  country_name            TEXT    NOT NULL,
  grade                   TEXT    NOT NULL,   -- 'Grade 1','AA','FAQ', etc.
  export_price_per_kg_usd NUMERIC,
  farm_gate_price         NUMERIC,
  farm_gate_currency      TEXT,
  notes                   TEXT,
  updated_at              TIMESTAMPTZ DEFAULT now(),
  updated_by              TEXT        DEFAULT 'admin',
  UNIQUE (country_code, grade)
);
CREATE INDEX IF NOT EXISTS idx_coffee_country ON coffee_prices (country_code);

-- ── 4. INPUT PRICES ─────────────────────────────────────────
-- Fertilizers, seeds, agrochemicals — 15+ countries
CREATE TABLE IF NOT EXISTS input_prices (
  id           SERIAL PRIMARY KEY,
  country_code CHAR(2) NOT NULL,
  country_name TEXT    NOT NULL,
  input_type   TEXT    NOT NULL,  -- 'fertilizer','seed','pesticide'
  input_name   TEXT    NOT NULL,  -- 'NPK 20-10-10','Maize Hybrid DK8031','Glyphosate 480'
  unit         TEXT,              -- 'per 50kg bag','per kg','per litre'
  price        NUMERIC,
  currency     TEXT,
  notes        TEXT,              -- subsidies, availability notes
  updated_at   TIMESTAMPTZ DEFAULT now(),
  updated_by   TEXT        DEFAULT 'admin',
  UNIQUE (country_code, input_type, input_name)
);
CREATE INDEX IF NOT EXISTS idx_ip_country   ON input_prices (country_code);
CREATE INDEX IF NOT EXISTS idx_ip_type      ON input_prices (input_type);

-- ── 5. MINIMUM WAGES (FARM PAYROLL) ─────────────────────────
-- 54 African countries
CREATE TABLE IF NOT EXISTS minimum_wages (
  id                    SERIAL PRIMARY KEY,
  country_code          CHAR(2) UNIQUE NOT NULL,
  country_name          TEXT    NOT NULL,
  currency              TEXT    NOT NULL,
  daily_rate_low        NUMERIC,   -- unskilled / casual labour
  daily_rate_mid        NUMERIC,   -- semi-skilled
  daily_rate_high       NUMERIC,   -- skilled / supervisory
  monthly_minimum       NUMERIC,   -- statutory monthly minimum wage
  pension_pct           NUMERIC    DEFAULT 0,
  health_pct            NUMERIC    DEFAULT 0,
  other_deductions_pct  NUMERIC    DEFAULT 0,
  effective_date        DATE,
  notes                 TEXT,
  updated_at            TIMESTAMPTZ DEFAULT now(),
  updated_by            TEXT        DEFAULT 'admin'
);

-- ── 6. REMITTANCE PROVIDERS ─────────────────────────────────
-- Provider fee structures per corridor
CREATE TABLE IF NOT EXISTS remittance_providers (
  id             SERIAL PRIMARY KEY,
  provider       TEXT    NOT NULL,  -- 'Wise','WorldRemit','Remitly', etc.
  send_country   TEXT    NOT NULL,  -- 'US','UK','EU','CA','AU'
  receive_country TEXT   NOT NULL,  -- 'NG','KE','GH','ZA', etc.
  fee_fixed_usd  NUMERIC DEFAULT 0,
  fee_pct        NUMERIC DEFAULT 0,
  fx_margin_pct  NUMERIC DEFAULT 0,
  transfer_time  TEXT,              -- 'Instant','1-2 days','3-5 days'
  min_send_usd   NUMERIC,
  max_send_usd   NUMERIC,
  delivery_method TEXT,             -- 'Bank','Mobile Money','Cash Pickup'
  notes          TEXT,
  active         BOOLEAN DEFAULT true,
  updated_at     TIMESTAMPTZ DEFAULT now(),
  updated_by     TEXT    DEFAULT 'admin',
  UNIQUE (provider, send_country, receive_country)
);
CREATE INDEX IF NOT EXISTS idx_rp_provider ON remittance_providers (provider);
CREATE INDEX IF NOT EXISTS idx_rp_corridor ON remittance_providers (send_country, receive_country);

-- ── Row Level Security (optional — enable if using anon key on public API) ──
-- ALTER TABLE commodity_prices   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cocoa_prices        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE coffee_prices       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE input_prices        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE minimum_wages       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE remittance_providers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read" ON commodity_prices   FOR SELECT USING (true);
-- CREATE POLICY "public read" ON cocoa_prices        FOR SELECT USING (true);
-- CREATE POLICY "public read" ON coffee_prices       FOR SELECT USING (true);
-- CREATE POLICY "public read" ON input_prices        FOR SELECT USING (true);
-- CREATE POLICY "public read" ON minimum_wages       FOR SELECT USING (true);
-- CREATE POLICY "public read" ON remittance_providers FOR SELECT USING (active = true);
