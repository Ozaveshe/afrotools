-- ============================================================
-- 003: FX Rate Snapshots
-- Target: DATA instance (jbmhfpkzbgyeodsqhprx.supabase.co)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fx_snapshots (
    id SERIAL PRIMARY KEY,
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    bank_rate NUMERIC(15,4),
    market_rate NUMERIC(15,4),
    remittance_rate NUMERIC(15,4),
    spread_pct NUMERIC(5,2),
    source TEXT,
    captured_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fx_pair_time
    ON public.fx_snapshots (base_currency, quote_currency, captured_at DESC);

-- RLS
ALTER TABLE public.fx_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read FX snapshots"
    ON public.fx_snapshots FOR SELECT
    USING (true);

-- No INSERT/UPDATE/DELETE policies for regular users.
-- Only service_role (which bypasses RLS) can write to this table.
