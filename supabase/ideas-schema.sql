-- ================================================================
-- AfroIdeas Database Schema
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. BUSINESS IDEAS TABLE (seeded with 10,000+ ideas)
CREATE TABLE IF NOT EXISTS business_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  cost_tier TEXT NOT NULL CHECK (cost_tier IN ('micro','small','medium','large')),
  risk TEXT NOT NULL CHECK (risk IN ('low','medium','high')),
  description TEXT NOT NULL,
  why_africa TEXT,
  revenue_model TEXT,
  risks TEXT[] DEFAULT '{}',
  scale_path TEXT,
  startup_cost_min BIGINT NOT NULL DEFAULT 0,
  startup_cost_max BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  monthly_revenue_min BIGINT DEFAULT 0,
  monthly_revenue_max BIGINT DEFAULT 0,
  monthly_costs_min BIGINT DEFAULT 0,
  monthly_costs_max BIGINT DEFAULT 0,
  breakeven_months_min INT DEFAULT 0,
  breakeven_months_max INT DEFAULT 0,
  regulations TEXT[] DEFAULT '{}',
  best_cities TEXT[] DEFAULT '{}',
  breakdown JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'seed',
  vote_count INT DEFAULT 0,
  save_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_ideas_sector ON business_ideas(sector);
CREATE INDEX IF NOT EXISTS idx_ideas_country ON business_ideas(country_code);
CREATE INDEX IF NOT EXISTS idx_ideas_cost_tier ON business_ideas(cost_tier);
CREATE INDEX IF NOT EXISTS idx_ideas_risk ON business_ideas(risk);
CREATE INDEX IF NOT EXISTS idx_ideas_country_sector ON business_ideas(country_code, sector);
CREATE INDEX IF NOT EXISTS idx_ideas_slug ON business_ideas(slug);
CREATE INDEX IF NOT EXISTS idx_ideas_startup_cost ON business_ideas(startup_cost_min);
CREATE INDEX IF NOT EXISTS idx_ideas_breakeven ON business_ideas(breakeven_months_min);
CREATE INDEX IF NOT EXISTS idx_ideas_votes ON business_ideas(vote_count DESC);

-- Full-text search
ALTER TABLE business_ideas ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || description || ' ' || COALESCE(why_africa, ''))) STORED;
CREATE INDEX IF NOT EXISTS idx_ideas_fts ON business_ideas USING gin(fts);

-- RLS: Public read, no direct write
ALTER TABLE business_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ideas" ON business_ideas;
CREATE POLICY "Public read ideas" ON business_ideas FOR SELECT USING (true);


-- 2. COMMUNITY IDEAS (user-submitted)
CREATE TABLE IF NOT EXISTS community_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  cost_tier TEXT NOT NULL CHECK (cost_tier IN ('micro','small','medium','large')),
  risk TEXT NOT NULL CHECK (risk IN ('low','medium','high')),
  description TEXT NOT NULL,
  why_africa TEXT,
  revenue_model TEXT,
  risks TEXT[] DEFAULT '{}',
  startup_cost_min BIGINT DEFAULT 0,
  startup_cost_max BIGINT DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  monthly_revenue_min BIGINT DEFAULT 0,
  monthly_revenue_max BIGINT DEFAULT 0,
  breakeven_months_min INT DEFAULT 0,
  breakeven_months_max INT DEFAULT 0,
  best_cities TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'published' CHECK (status IN ('published','flagged','removed')),
  vote_count INT DEFAULT 0,
  save_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  user_display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_sector ON community_ideas(sector);
CREATE INDEX IF NOT EXISTS idx_community_country ON community_ideas(country_code);
CREATE INDEX IF NOT EXISTS idx_community_user ON community_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_community_status ON community_ideas(status);
CREATE INDEX IF NOT EXISTS idx_community_votes ON community_ideas(vote_count DESC);

-- Full-text search for community ideas
ALTER TABLE community_ideas ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || description || ' ' || COALESCE(why_africa, ''))) STORED;
CREATE INDEX IF NOT EXISTS idx_community_fts ON community_ideas USING gin(fts);

-- RLS: Anyone can read published, authenticated can insert own, update own
ALTER TABLE community_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read published community ideas" ON community_ideas;
CREATE POLICY "Read published community ideas" ON community_ideas FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Insert own community ideas" ON community_ideas;
CREATE POLICY "Insert own community ideas" ON community_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update own community ideas" ON community_ideas;
CREATE POLICY "Update own community ideas" ON community_ideas FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Delete own community ideas" ON community_ideas;
CREATE POLICY "Delete own community ideas" ON community_ideas FOR DELETE USING (auth.uid() = user_id);


-- 3. IDEA VOTES
CREATE TABLE IF NOT EXISTS idea_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID,
  community_idea_id UUID,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up','down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_target CHECK (
    (idea_id IS NOT NULL AND community_idea_id IS NULL) OR
    (idea_id IS NULL AND community_idea_id IS NOT NULL)
  ),
  CONSTRAINT unique_vote_idea UNIQUE(user_id, idea_id),
  CONSTRAINT unique_vote_community UNIQUE(user_id, community_idea_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_user ON idea_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_idea ON idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_votes_community ON idea_votes(community_idea_id);

ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own votes" ON idea_votes;
CREATE POLICY "Read own votes" ON idea_votes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Insert own votes" ON idea_votes;
CREATE POLICY "Insert own votes" ON idea_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Delete own votes" ON idea_votes;
CREATE POLICY "Delete own votes" ON idea_votes FOR DELETE USING (auth.uid() = user_id);


-- 4. SAVED IDEAS (bookmarks)
CREATE TABLE IF NOT EXISTS idea_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID,
  community_idea_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_save_target CHECK (
    (idea_id IS NOT NULL AND community_idea_id IS NULL) OR
    (idea_id IS NULL AND community_idea_id IS NOT NULL)
  ),
  CONSTRAINT unique_save_idea UNIQUE(user_id, idea_id),
  CONSTRAINT unique_save_community UNIQUE(user_id, community_idea_id)
);

CREATE INDEX IF NOT EXISTS idx_saves_user ON idea_saves(user_id);
ALTER TABLE idea_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own saves" ON idea_saves;
CREATE POLICY "Read own saves" ON idea_saves FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Insert own saves" ON idea_saves;
CREATE POLICY "Insert own saves" ON idea_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Delete own saves" ON idea_saves;
CREATE POLICY "Delete own saves" ON idea_saves FOR DELETE USING (auth.uid() = user_id);


-- 5. IDEA COMMENTS / DISCUSSION
CREATE TABLE IF NOT EXISTS idea_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID,
  community_idea_id UUID,
  parent_id UUID REFERENCES idea_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  user_display_name TEXT,
  vote_count INT DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('published','flagged','removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_comment_target CHECK (
    (idea_id IS NOT NULL AND community_idea_id IS NULL) OR
    (idea_id IS NULL AND community_idea_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_comments_idea ON idea_comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_community ON idea_comments(community_idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON idea_comments(user_id);

ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read published comments" ON idea_comments;
CREATE POLICY "Read published comments" ON idea_comments FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Insert own comments" ON idea_comments;
CREATE POLICY "Insert own comments" ON idea_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update own comments" ON idea_comments;
CREATE POLICY "Update own comments" ON idea_comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Delete own comments" ON idea_comments;
CREATE POLICY "Delete own comments" ON idea_comments FOR DELETE USING (auth.uid() = user_id);


-- 6. TRIGGER: Auto-update vote_count on business_ideas
CREATE OR REPLACE FUNCTION update_idea_vote_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    -- Update business_ideas
    IF NEW IS NOT NULL AND NEW.idea_id IS NOT NULL THEN
      UPDATE business_ideas SET vote_count = (
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
        FROM idea_votes WHERE idea_id = NEW.idea_id
      ) WHERE id = NEW.idea_id;
    END IF;
    IF OLD IS NOT NULL AND OLD.idea_id IS NOT NULL THEN
      UPDATE business_ideas SET vote_count = (
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
        FROM idea_votes WHERE idea_id = OLD.idea_id
      ) WHERE id = OLD.idea_id;
    END IF;
    -- Update community_ideas
    IF NEW IS NOT NULL AND NEW.community_idea_id IS NOT NULL THEN
      UPDATE community_ideas SET vote_count = (
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
        FROM idea_votes WHERE community_idea_id = NEW.community_idea_id
      ) WHERE id = NEW.community_idea_id;
    END IF;
    IF OLD IS NOT NULL AND OLD.community_idea_id IS NOT NULL THEN
      UPDATE community_ideas SET vote_count = (
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
        FROM idea_votes WHERE community_idea_id = OLD.community_idea_id
      ) WHERE id = OLD.community_idea_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_vote_count ON idea_votes;
CREATE TRIGGER trg_vote_count
  AFTER INSERT OR DELETE ON idea_votes
  FOR EACH ROW EXECUTE FUNCTION update_idea_vote_count();


-- 7. TRIGGER: Auto-update save_count
CREATE OR REPLACE FUNCTION update_idea_save_count() RETURNS TRIGGER AS $$
BEGIN
  IF NEW IS NOT NULL AND NEW.idea_id IS NOT NULL THEN
    UPDATE business_ideas SET save_count = (SELECT COUNT(*) FROM idea_saves WHERE idea_id = NEW.idea_id) WHERE id = NEW.idea_id;
  END IF;
  IF OLD IS NOT NULL AND OLD.idea_id IS NOT NULL THEN
    UPDATE business_ideas SET save_count = (SELECT COUNT(*) FROM idea_saves WHERE idea_id = OLD.idea_id) WHERE id = OLD.idea_id;
  END IF;
  IF NEW IS NOT NULL AND NEW.community_idea_id IS NOT NULL THEN
    UPDATE community_ideas SET save_count = (SELECT COUNT(*) FROM idea_saves WHERE community_idea_id = NEW.community_idea_id) WHERE id = NEW.community_idea_id;
  END IF;
  IF OLD IS NOT NULL AND OLD.community_idea_id IS NOT NULL THEN
    UPDATE community_ideas SET save_count = (SELECT COUNT(*) FROM idea_saves WHERE community_idea_id = OLD.community_idea_id) WHERE id = OLD.community_idea_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_save_count ON idea_saves;
CREATE TRIGGER trg_save_count
  AFTER INSERT OR DELETE ON idea_saves
  FOR EACH ROW EXECUTE FUNCTION update_idea_save_count();
