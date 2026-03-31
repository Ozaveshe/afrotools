-- ============================================================
-- TAGWAVE (creator-hashtags) — Migration
-- Target: jbmhfpkzbgyeodsqhprx (AfroTools Data Instance)
-- ============================================================

CREATE TABLE IF NOT EXISTS creator_hashtags_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  platform TEXT DEFAULT 'instagram',
  sets JSONB NOT NULL,
  custom_mix JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_hashtags_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own hashtags"
  ON creator_hashtags_history
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_creator_hashtags_user
  ON creator_hashtags_history(user_id, created_at DESC);
