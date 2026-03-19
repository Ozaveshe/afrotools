-- ============================================================
-- 004: User Workflows
-- Target: DATA instance (jbmhfpkzbgyeodsqhprx.supabase.co)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    steps JSONB NOT NULL,
    is_template BOOLEAN DEFAULT false,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.user_workflows ENABLE ROW LEVEL SECURITY;

-- Public templates are readable by anyone
CREATE POLICY "Anyone can read workflow templates"
    ON public.user_workflows FOR SELECT
    USING (is_template = true OR auth.uid() = user_id);

-- Only the owner can insert their own workflows
CREATE POLICY "Users can insert own workflows"
    ON public.user_workflows FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only the owner can update their own workflows
CREATE POLICY "Users can update own workflows"
    ON public.user_workflows FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Only the owner can delete their own workflows
CREATE POLICY "Users can delete own workflows"
    ON public.user_workflows FOR DELETE
    USING (auth.uid() = user_id);
