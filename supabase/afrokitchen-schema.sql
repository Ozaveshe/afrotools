-- =============================================
-- AFROKITCHEN — Supabase Schema
-- Africa's Recipe Platform (all 54 countries)
-- =============================================

-- RECIPES
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_local TEXT,
  description TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  region TEXT NOT NULL,
  ethnic_group TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  diet_tags TEXT[] DEFAULT '{}',
  prep_time_minutes INTEGER NOT NULL,
  cook_time_minutes INTEGER NOT NULL,
  total_time_minutes INTEGER GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  default_servings INTEGER NOT NULL DEFAULT 6,
  serving_unit TEXT DEFAULT 'servings',
  story TEXT,
  occasion TEXT,
  best_served_with TEXT,
  regional_variations TEXT,
  image_url TEXT,
  image_alt TEXT,
  video_url TEXT,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  author TEXT DEFAULT 'AfroKitchen',
  source TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_country ON recipes(country_code);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);

-- RECIPE INGREDIENTS
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  group_name TEXT,
  amount NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  name TEXT NOT NULL,
  prep_note TEXT,
  is_optional BOOLEAN DEFAULT false,
  substitution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- RECIPE STEPS
CREATE TABLE IF NOT EXISTS recipe_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  instruction TEXT NOT NULL,
  timer_seconds INTEGER,
  timer_label TEXT,
  tip TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);

-- MASTER INGREDIENTS
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_local JSONB DEFAULT '{}',
  category TEXT NOT NULL,
  calories_per_100g INTEGER,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  fiber_per_100g NUMERIC,
  default_unit TEXT DEFAULT 'g',
  cup_weight_g NUMERIC,
  piece_weight_g NUMERIC,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

-- INGREDIENT PRICES
CREATE TABLE IF NOT EXISTS ingredient_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency_code TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL,
  market_type TEXT DEFAULT 'market',
  city TEXT,
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'estimate',
  UNIQUE(ingredient_id, country_code, unit, market_type)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_prices_country ON ingredient_prices(country_code);
CREATE INDEX IF NOT EXISTS idx_ingredient_prices_ingredient ON ingredient_prices(ingredient_id);

-- RECIPE REVIEWS
CREATE TABLE IF NOT EXISTS recipe_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  author_name TEXT,
  country_code TEXT,
  modifications TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMUNITY SUBMISSIONS
CREATE TABLE IF NOT EXISTS recipe_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  description TEXT,
  ingredients_text TEXT NOT NULL,
  steps_text TEXT NOT NULL,
  story TEXT,
  submitted_by TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COLLECTIONS
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  recipe_ids UUID[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read recipes" ON recipes FOR SELECT USING (true);
CREATE POLICY "Public read ingredients" ON recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "Public read steps" ON recipe_steps FOR SELECT USING (true);
CREATE POLICY "Public read master ingredients" ON ingredients FOR SELECT USING (true);
CREATE POLICY "Public read prices" ON ingredient_prices FOR SELECT USING (true);
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (true);

-- Public insert for reviews and submissions
CREATE POLICY "Public insert reviews" ON recipe_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read reviews" ON recipe_reviews FOR SELECT USING (true);
CREATE POLICY "Public insert submissions" ON recipe_submissions FOR INSERT WITH CHECK (true);
