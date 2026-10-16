-- 019-afropayroll-os-workflows.sql
-- Persist AfroPayroll OS journey progress for logged-in users so they can resume across devices.

CREATE TABLE IF NOT EXISTS public.apo_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_type TEXT NOT NULL,
  country TEXT,
  current_step INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 0,
  carry_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  step_statuses JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'complete')),
  last_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, journey_type)
);

CREATE INDEX IF NOT EXISTS idx_apo_workflows_user_updated
  ON public.apo_workflows (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_apo_workflows_status
  ON public.apo_workflows (status);

ALTER TABLE public.apo_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own AfroPayroll workflows"
  ON public.apo_workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AfroPayroll workflows"
  ON public.apo_workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AfroPayroll workflows"
  ON public.apo_workflows FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AfroPayroll workflows"
  ON public.apo_workflows FOR DELETE
  USING (auth.uid() = user_id);
