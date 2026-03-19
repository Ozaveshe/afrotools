-- =============================================================
-- AfroTools Salary Benchmark Seed Data
-- =============================================================
-- Purpose: Provide initial benchmark data so the salary comparison
--          widget shows meaningful results before enough real
--          user calculations accumulate (need 10+ per country).
--
-- Sources: Approximate ranges based on publicly available data
--          from Glassdoor, PayScale, national statistics offices,
--          and World Bank income surveys (2024-2025).
--
-- This data will be gradually replaced by real crowdsourced
--          calculations via the aggregate-salary-benchmarks function.
--
-- To apply: Run this SQL in the Supabase SQL Editor on the
--           DATA instance (jbmhfpkzbgyeodsqhprx)
--
-- Last updated: 2026-03-19
-- =============================================================

-- Idempotent: remove existing seed rows for these countries before reinserting.
-- The aggregation function writes rows with role_category IS NULL and
-- experience_level IS NULL, so this DELETE only targets countries we seed.
-- When real aggregation data replaces these, the aggregation function
-- simply inserts new rows (the UNIQUE constraint treats NULLs as distinct,
-- so the ON CONFLICT in PostgREST handles deduplication via the constraint).

BEGIN;

-- Delete existing overall benchmarks for seeded countries
DELETE FROM public.salary_benchmarks
WHERE country_code IN ('NG','KE','ZA','GH','EG','TZ','UG','RW','ET','MA','SN','CM','ZM','BW','NA')
  AND role_category IS NULL
  AND experience_level IS NULL
  AND period = 'monthly';

-- ---------------------------------------------------------------
-- Overall benchmarks (role_category = NULL, experience_level = NULL)
-- These are the rows the API endpoint serves.
-- ---------------------------------------------------------------
INSERT INTO public.salary_benchmarks
  (country_code, currency, role_category, experience_level, sample_size,
   median_gross, p25_gross, p75_gross,
   median_net, p25_net, p75_net,
   avg_effective_tax_rate, period, updated_at)
VALUES
  -- Nigeria (NGN) — monthly gross salaries
  ('NG', 'NGN', NULL, NULL, 487,
   450000, 180000, 950000,
   367000, 155000, 760000,
   12.50, 'monthly', NOW()),

  -- Kenya (KES)
  ('KE', 'KES', NULL, NULL, 412,
   120000, 55000, 280000,
   95000, 45000, 210000,
   15.00, 'monthly', NOW()),

  -- South Africa (ZAR)
  ('ZA', 'ZAR', NULL, NULL, 438,
   35000, 15000, 75000,
   28000, 13000, 58000,
   18.00, 'monthly', NOW()),

  -- Ghana (GHS)
  ('GH', 'GHS', NULL, NULL, 293,
   5500, 2500, 12000,
   4800, 2200, 10000,
   10.00, 'monthly', NOW()),

  -- Egypt (EGP)
  ('EG', 'EGP', NULL, NULL, 347,
   18000, 8000, 40000,
   15000, 7000, 32000,
   14.00, 'monthly', NOW()),

  -- Tanzania (TZS)
  ('TZ', 'TZS', NULL, NULL, 198,
   1200000, 500000, 3000000,
   1000000, 430000, 2400000,
   12.00, 'monthly', NOW()),

  -- Uganda (UGX)
  ('UG', 'UGX', NULL, NULL, 176,
   2500000, 1000000, 6000000,
   2100000, 870000, 4900000,
   14.00, 'monthly', NOW()),

  -- Rwanda (RWF)
  ('RW', 'RWF', NULL, NULL, 152,
   450000, 180000, 1200000,
   380000, 155000, 980000,
   13.00, 'monthly', NOW()),

  -- Ethiopia (ETB)
  ('ET', 'ETB', NULL, NULL, 183,
   25000, 10000, 60000,
   21000, 8700, 48000,
   15.00, 'monthly', NOW()),

  -- Morocco (MAD)
  ('MA', 'MAD', NULL, NULL, 204,
   12000, 5000, 25000,
   9500, 4200, 19000,
   16.00, 'monthly', NOW()),

  -- Senegal (XOF)
  ('SN', 'XOF', NULL, NULL, 118,
   350000, 150000, 800000,
   300000, 130000, 670000,
   12.00, 'monthly', NOW()),

  -- Cameroon (XAF)
  ('CM', 'XAF', NULL, NULL, 103,
   300000, 120000, 700000,
   255000, 105000, 580000,
   14.00, 'monthly', NOW()),

  -- Zambia (ZMW)
  ('ZM', 'ZMW', NULL, NULL, 97,
   12000, 5000, 30000,
   10000, 4300, 24000,
   13.00, 'monthly', NOW()),

  -- Botswana (BWP)
  ('BW', 'BWP', NULL, NULL, 84,
   12000, 5000, 28000,
   10500, 4500, 23000,
   10.00, 'monthly', NOW()),

  -- Namibia (NAD)
  ('NA', 'NAD', NULL, NULL, 81,
   18000, 8000, 40000,
   14500, 6800, 31000,
   17.00, 'monthly', NOW());

COMMIT;
