-- ============================================================
-- 20260417005254: Add Workspace Items Table
-- Target: AUTH instance (zpclagtgczsygrgztlts.supabase.co)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workspace_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (char_length(item_type) >= 1 AND char_length(item_type) <= 64),
    item_key TEXT NOT NULL CHECK (char_length(item_key) >= 1 AND char_length(item_key) <= 120),
    tool_slug TEXT,
    title TEXT NOT NULL DEFAULT 'Untitled item',
    summary TEXT,
    href TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, item_type, item_key)
);

CREATE INDEX IF NOT EXISTS workspace_items_user_updated_idx
    ON public.workspace_items (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS workspace_items_user_type_updated_idx
    ON public.workspace_items (user_id, item_type, updated_at DESC);

ALTER TABLE public.workspace_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspace_items'
      AND policyname = 'Users can view own workspace items'
  ) THEN
    CREATE POLICY "Users can view own workspace items"
      ON public.workspace_items FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspace_items'
      AND policyname = 'Users can insert own workspace items'
  ) THEN
    CREATE POLICY "Users can insert own workspace items"
      ON public.workspace_items FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspace_items'
      AND policyname = 'Users can update own workspace items'
  ) THEN
    CREATE POLICY "Users can update own workspace items"
      ON public.workspace_items FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspace_items'
      AND policyname = 'Users can delete own workspace items'
  ) THEN
    CREATE POLICY "Users can delete own workspace items"
      ON public.workspace_items FOR DELETE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_workspace_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workspace_items_set_updated_at ON public.workspace_items;
CREATE TRIGGER workspace_items_set_updated_at
    BEFORE UPDATE ON public.workspace_items
    FOR EACH ROW
    EXECUTE FUNCTION public.set_workspace_items_updated_at();
