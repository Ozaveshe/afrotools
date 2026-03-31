-- Creator Studio Tables (Production Tools)
-- Applied 2026-03-31 to zpclagtgczsygrgztlts

-- 1. ThumbnailForge projects
CREATE TABLE IF NOT EXISTS creator_thumb_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  layers JSONB DEFAULT '[]',
  template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE creator_thumb_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own thumb projects" ON creator_thumb_projects FOR ALL USING (auth.uid() = user_id);

-- 2. CarouselStudio projects
CREATE TABLE IF NOT EXISTS creator_carousel_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  format TEXT DEFAULT 'instagram',
  branding JSONB DEFAULT '{}',
  slides JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE creator_carousel_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own carousel projects" ON creator_carousel_projects FOR ALL USING (auth.uid() = user_id);

-- 3. TitleSmith history
CREATE TABLE IF NOT EXISTS creator_titles_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platform TEXT DEFAULT 'youtube',
  titles JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE creator_titles_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own titles history" ON creator_titles_history FOR ALL USING (auth.uid() = user_id);

-- 4. HookFactory history
CREATE TABLE IF NOT EXISTS creator_hooks_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platform TEXT DEFAULT 'youtube',
  content_type TEXT DEFAULT 'video',
  hooks JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE creator_hooks_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own hooks history" ON creator_hooks_history FOR ALL USING (auth.uid() = user_id);

-- 5. CaptionCraft history
CREATE TABLE IF NOT EXISTS creator_captions_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brief TEXT NOT NULL,
  platform TEXT DEFAULT 'instagram',
  tone TEXT DEFAULT 'casual',
  captions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE creator_captions_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own captions history" ON creator_captions_history FOR ALL USING (auth.uid() = user_id);

-- 6. BioForge history
CREATE TABLE IF NOT EXISTS creator_bios_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  who TEXT NOT NULL,
  what TEXT,
  tone TEXT DEFAULT 'professional',
  bios JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE creator_bios_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bios history" ON creator_bios_history FOR ALL USING (auth.uid() = user_id);

-- 7. ScriptPad history
CREATE TABLE IF NOT EXISTS creator_scripts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  format TEXT DEFAULT 'youtube',
  duration TEXT DEFAULT '5-8min',
  script JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE creator_scripts_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scripts history" ON creator_scripts_history FOR ALL USING (auth.uid() = user_id);

-- 8. Repurpose history
CREATE TABLE IF NOT EXISTS creator_repurpose_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_text TEXT NOT NULL,
  target_platforms JSONB DEFAULT '[]',
  outputs JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE creator_repurpose_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own repurpose history" ON creator_repurpose_history FOR ALL USING (auth.uid() = user_id);

-- 9. Hashtags history
CREATE TABLE IF NOT EXISTS creator_hashtags_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platform TEXT DEFAULT 'instagram',
  sets JSONB NOT NULL,
  custom_mix JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE creator_hashtags_history ENABLE ROW LEVEL SECURITY;
