-- Preserve source-backed net-worth evidence when a refresh cannot parse a
-- current profile value. This keeps scheduled snapshot refreshes from erasing
-- the latest known estimate.

CREATE OR REPLACE FUNCTION public.preserve_afrostream_snapshot_net_worth()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.net_worth_value IS NULL THEN
    SELECT s.net_worth_value
    INTO NEW.net_worth_value
    FROM public.as_creator_snapshots s
    WHERE s.creator_id = NEW.creator_id
      AND s.snapshot_date < NEW.snapshot_date
      AND s.net_worth_value IS NOT NULL
    ORDER BY s.snapshot_date DESC, s.created_at DESC, s.id DESC
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_preserve_afrostream_snapshot_net_worth
ON public.as_creator_snapshots;

CREATE TRIGGER trg_preserve_afrostream_snapshot_net_worth
BEFORE INSERT OR UPDATE OF net_worth_value, snapshot_date, creator_id
ON public.as_creator_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.preserve_afrostream_snapshot_net_worth();
