-- ============================================================
-- 002: Salary Benchmarks (aggregated, anonymized)
-- Target: DATA instance (jbmhfpkzbgyeodsqhprx.supabase.co)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.salary_benchmarks (
    id SERIAL PRIMARY KEY,
    country_code TEXT NOT NULL,
    currency TEXT NOT NULL,
    role_category TEXT,
    experience_level TEXT,
    sample_size INTEGER NOT NULL DEFAULT 0,
    median_gross NUMERIC(15,2),
    p25_gross NUMERIC(15,2),
    p75_gross NUMERIC(15,2),
    median_net NUMERIC(15,2),
    p25_net NUMERIC(15,2),
    p75_net NUMERIC(15,2),
    avg_effective_tax_rate NUMERIC(5,2),
    period TEXT NOT NULL DEFAULT 'monthly',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (country_code, role_category, experience_level, period)
);

-- RLS
ALTER TABLE public.salary_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read salary benchmarks"
    ON public.salary_benchmarks FOR SELECT
    USING (true);

-- No INSERT/UPDATE/DELETE policies for regular users.
-- Only service_role (which bypasses RLS) can write to this table.
