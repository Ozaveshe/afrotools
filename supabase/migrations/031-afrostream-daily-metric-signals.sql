-- AfroStream daily metric signals
-- Extends creator snapshots so profile stat cards can show honest movement
-- across followers, views, AfroScore, valuation checks, and stream cadence.

ALTER TABLE public.as_creator_snapshots
  ADD COLUMN IF NOT EXISTS net_worth_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stream_cadence TEXT,
  ADD COLUMN IF NOT EXISTS stream_count_30d INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_status TEXT DEFAULT 'tracked',
  ADD COLUMN IF NOT EXISTS source_quality SMALLINT DEFAULT 60;

CREATE INDEX IF NOT EXISTS as_creator_snapshots_creator_metric_idx
  ON public.as_creator_snapshots (creator_id, snapshot_date DESC, total_followers, total_views, afro_score);
