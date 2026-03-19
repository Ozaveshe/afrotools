-- ============================================================
-- 001: Calculation History
-- Target: DATA instance (jbmhfpkzbgyeodsqhprx.supabase.co)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.calculation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_slug TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    country_code TEXT,
    inputs JSONB NOT NULL,
    outputs JSONB NOT NULL,
    currency TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calc_history_user
    ON public.calculation_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calc_history_tool
    ON public.calculation_history (tool_slug);

CREATE INDEX IF NOT EXISTS idx_calc_history_country
    ON public.calculation_history (country_code)
    WHERE country_code IS NOT NULL;

-- RLS
ALTER TABLE public.calculation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own calculations"
    ON public.calculation_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations"
    ON public.calculation_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations"
    ON public.calculation_history FOR DELETE
    USING (auth.uid() = user_id);
