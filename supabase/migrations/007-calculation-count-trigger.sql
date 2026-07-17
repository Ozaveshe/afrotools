-- ============================================================
-- 007: Calculation Count Trigger
-- Target: DATA instance (jbmhfpkzbgyeodsqhprx.supabase.co)
--
-- NOTE: This trigger updates profiles.calculation_count on the
-- AUTH instance. Since calculation_history lives on the DATA
-- instance, this trigger will only work if both tables are on
-- the same Supabase instance. If they are on separate instances,
-- you will need to increment the count via application code
-- (e.g., a Netlify function) instead of a DB trigger.
-- ============================================================

CREATE OR REPLACE FUNCTION increment_calculation_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET calculation_count = calculation_count + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS on_calculation_insert ON public.calculation_history;

CREATE TRIGGER on_calculation_insert
    AFTER INSERT ON public.calculation_history
    FOR EACH ROW
    EXECUTE FUNCTION increment_calculation_count();
