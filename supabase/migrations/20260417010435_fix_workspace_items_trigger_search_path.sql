-- ============================================================
-- 20260417010435: Harden Workspace Items Trigger Function
-- Target: AUTH instance (zpclagtgczsygrgztlts.supabase.co)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_workspace_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;
