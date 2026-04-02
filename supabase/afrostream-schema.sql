-- ================================================================
-- AfroStream — Supabase Schema
-- Instance: DATA (jbmhfpkzbgyeodsqhprx)
-- Tables: as_creators, as_streams, as_news, as_featured, as_settings
-- ================================================================

-- ── CREATORS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS as_creators (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  country       TEXT NOT NULL DEFAULT 'Nigeria',
  bio           TEXT,
  platforms     TEXT,          -- comma-separated URLs (legacy)
  categories    TEXT,          -- comma-separated: gaming, tech, music...
  avatar        TEXT,          -- URL
  cover         TEXT,          -- URL
  net_worth     TEXT,          -- display string e.g. "$50,000"
  -- Platform links (individual)
  youtube_url   TEXT,
  twitch_url    TEXT,
  tiktok_url    TEXT,
  instagram_url TEXT,
  twitter_url   TEXT,
  kick_url      TEXT,
  -- Stats
  subscribers   BIGINT DEFAULT 0,
  total_views   BIGINT DEFAULT 0,
  peak_viewers  INT DEFAULT 0,
  avg_duration  TEXT,          -- e.g. "2h 30m"
  frequency     TEXT,          -- e.g. "Daily", "3x/week"
  gift_revenue  TEXT,          -- e.g. "$12,000"
  growth_rate   TEXT,          -- e.g. "+15%"
  -- Profile extras
  languages     TEXT,          -- comma-separated: English, Yoruba, French
  tags          TEXT,          -- comma-separated: IRL, Just Chatting, Afrobeats
  streaming_since TEXT,        -- e.g. "2021" or "March 2022"
  primary_platform TEXT DEFAULT 'youtube', -- youtube, twitch, tiktok, instagram, kick
  -- Flags
  verified      BOOLEAN DEFAULT FALSE,
  flagged       BOOLEAN DEFAULT FALSE,
  is_published  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_as_creators_country ON as_creators(country);
CREATE INDEX IF NOT EXISTS idx_as_creators_published ON as_creators(is_published);
CREATE INDEX IF NOT EXISTS idx_as_creators_slug ON as_creators(slug);

-- ── STREAMS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS as_streams (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id    BIGINT REFERENCES as_creators(id) ON DELETE SET NULL,
  creator_name  TEXT NOT NULL,          -- denormalized for speed
  title         TEXT NOT NULL,
  platform      TEXT NOT NULL DEFAULT 'youtube',  -- youtube, twitch, tiktok, instagram, kick
  category      TEXT NOT NULL DEFAULT 'gaming',
  country       TEXT NOT NULL DEFAULT 'Nigeria',
  stream_date   TIMESTAMPTZ NOT NULL,
  url           TEXT,
  thumbnail     TEXT,
  viewer_count  INTEGER DEFAULT 0,
  is_live       BOOLEAN DEFAULT FALSE,
  is_published  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_as_streams_date ON as_streams(stream_date);
CREATE INDEX IF NOT EXISTS idx_as_streams_live ON as_streams(is_live);
CREATE INDEX IF NOT EXISTS idx_as_streams_platform ON as_streams(platform);
CREATE INDEX IF NOT EXISTS idx_as_streams_published ON as_streams(is_published);

-- ── NEWS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS as_news (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  category      TEXT NOT NULL DEFAULT 'milestones', -- milestones, platform, collabs, drama, business, rising
  image_url     TEXT,
  author        TEXT DEFAULT 'AfroStream Team',
  excerpt       TEXT NOT NULL,
  body          TEXT NOT NULL,
  is_featured   BOOLEAN DEFAULT FALSE,
  is_published  BOOLEAN DEFAULT TRUE,
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_as_news_category ON as_news(category);
CREATE INDEX IF NOT EXISTS idx_as_news_published ON as_news(is_published);
CREATE INDEX IF NOT EXISTS idx_as_news_featured ON as_news(is_featured);
CREATE INDEX IF NOT EXISTS idx_as_news_slug ON as_news(slug);

-- ── FEATURED ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS as_featured (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id    BIGINT REFERENCES as_creators(id) ON DELETE CASCADE,
  sort_order    INT DEFAULT 0,
  is_cotw       BOOLEAN DEFAULT FALSE,   -- creator of the week
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_as_featured_order ON as_featured(sort_order);

-- ── SETTINGS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS as_settings (
  key           TEXT PRIMARY KEY,
  value         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO as_settings (key, value) VALUES
  ('afropoints_enabled', 'false'),
  ('creator_of_week', '')
ON CONFLICT (key) DO NOTHING;

-- ── RLS POLICIES ─────────────────────────────────────────────────
-- Public read access for published items, service key for writes

ALTER TABLE as_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_streams  ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_news     ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_featured ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_settings ENABLE ROW LEVEL SECURITY;

-- Public read (published only)
CREATE POLICY "Public read creators" ON as_creators FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Public read streams"  ON as_streams  FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Public read news"     ON as_news     FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Public read featured" ON as_featured FOR SELECT USING (TRUE);
CREATE POLICY "Public read settings" ON as_settings FOR SELECT USING (TRUE);

-- Service key full access (admin via Netlify function)
CREATE POLICY "Service full creators" ON as_creators FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service full streams"  ON as_streams  FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service full news"     ON as_news     FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service full featured" ON as_featured FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service full settings" ON as_settings FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ── AUTO-UPDATE updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION as_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_as_creators_updated BEFORE UPDATE ON as_creators FOR EACH ROW EXECUTE FUNCTION as_update_timestamp();
CREATE TRIGGER trg_as_streams_updated  BEFORE UPDATE ON as_streams  FOR EACH ROW EXECUTE FUNCTION as_update_timestamp();
CREATE TRIGGER trg_as_news_updated     BEFORE UPDATE ON as_news     FOR EACH ROW EXECUTE FUNCTION as_update_timestamp();
