-- CreatorCalendar — Content Calendar & Planner
-- Migration: Create tables for posts, content pillars, and platforms

-- Content Pillars (categories for organizing content strategy)
CREATE TABLE IF NOT EXISTS creator_content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  icon TEXT,
  target_percentage INTEGER DEFAULT 20,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts (the core content items)
CREATE TABLE IF NOT EXISTS creator_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pillar_id UUID REFERENCES creator_content_pillars(id) ON DELETE SET NULL,
  title TEXT,
  caption TEXT,
  hashtags TEXT,
  platforms JSONB DEFAULT '[]',
  post_type TEXT CHECK (post_type IN ('post','reel','carousel','story','thread','video','article','newsletter','short')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','ready','posted','missed')),
  scheduled_date DATE,
  scheduled_time TIME,
  repeat_type TEXT CHECK (repeat_type IN ('once','weekly','biweekly','monthly')),
  media_urls JSONB DEFAULT '[]',
  notes TEXT,
  project_id UUID,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator Platforms (which platforms the user is active on)
CREATE TABLE IF NOT EXISTS creator_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','tiktok','youtube','twitter','linkedin','facebook','newsletter')),
  handle TEXT,
  follower_count INTEGER,
  best_posting_times JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date-range queries
CREATE INDEX IF NOT EXISTS idx_creator_posts_user_date ON creator_posts(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_creator_posts_status ON creator_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_creator_pillars_user ON creator_content_pillars(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_platforms_user ON creator_platforms(user_id);

-- RLS policies
ALTER TABLE creator_content_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_platforms ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users see own pillars" ON creator_content_pillars
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own posts" ON creator_posts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own platforms" ON creator_platforms
  FOR ALL USING (auth.uid() = user_id);

-- Allow anon read for demo/public posts (optional, remove if not needed)
CREATE POLICY "Anon can insert posts" ON creator_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can insert pillars" ON creator_content_pillars
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can insert platforms" ON creator_platforms
  FOR INSERT WITH CHECK (true);
