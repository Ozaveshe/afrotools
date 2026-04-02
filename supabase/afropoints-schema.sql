-- ══════════════════════════════════════════════════════════════
-- AFROPOINTS — Crowdsourced Data Engine with Gamified Rewards
-- Run on DATA instance: jbmhfpkzbgyeodsqhprx.supabase.co
-- ══════════════════════════════════════════════════════════════

-- Master contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data_category TEXT NOT NULL,
  country_code TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  currency_code TEXT NOT NULL,
  payload JSONB NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  confidence_score NUMERIC DEFAULT 0,
  confirmed_by_count INTEGER DEFAULT 0,
  points_awarded INTEGER DEFAULT 0,
  bonus_awarded BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  latitude NUMERIC,
  longitude NUMERIC
);

-- Points ledger — source of truth for balance
CREATE TABLE IF NOT EXISTS points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  contribution_id UUID REFERENCES contributions(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User points profile — denormalized for fast reads
CREATE TABLE IF NOT EXISTS points_profiles (
  user_id UUID PRIMARY KEY,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  contributions_count INTEGER DEFAULT 0,
  confirmations_count INTEGER DEFAULT 0,
  trust_score NUMERIC DEFAULT 50,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'newcomer',
  primary_country TEXT,
  primary_city TEXT,
  badges JSONB DEFAULT '[]',
  last_submission_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cashout requests
CREATE TABLE IF NOT EXISTS cashout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points_amount INTEGER NOT NULL,
  cash_amount NUMERIC NOT NULL,
  cash_currency TEXT NOT NULL DEFAULT 'USD',
  payout_method TEXT NOT NULL,
  payout_details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard cache
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  rank_position INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  contributions_count INTEGER NOT NULL,
  trust_score NUMERIC,
  period TEXT NOT NULL,
  refreshed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scope, user_id, period)
);

-- Badges definition
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_emoji TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_json JSONB NOT NULL,
  points_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_contributions_user ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_category ON contributions(data_category);
CREATE INDEX IF NOT EXISTS idx_contributions_country ON contributions(country_code);
CREATE INDEX IF NOT EXISTS idx_contributions_city ON contributions(country_code, city);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_submitted ON contributions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_consensus ON contributions(data_category, country_code, city, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created ON points_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashout_user ON cashout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cashout_status ON cashout_requests(status);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scope ON leaderboard_cache(scope, period, rank_position);

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read confirmed contributions" ON contributions FOR SELECT USING (status = 'confirmed');
CREATE POLICY "Users can read own contributions" ON contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert contributions" ON contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own points" ON points_ledger FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own profile" ON points_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON points_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON points_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read leaderboards" ON leaderboard_cache FOR SELECT USING (true);
CREATE POLICY "Anyone can read badges" ON badges FOR SELECT USING (true);

CREATE POLICY "Users can read own cashouts" ON cashout_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can request cashouts" ON cashout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
-- SEED BADGES
-- ══════════════════════════════════════════════════════════════
INSERT INTO badges (id, name, description, icon_emoji, category, requirement_json, points_bonus) VALUES
  ('first_blood', 'First Blood', 'Submit your first data point', '🎯', 'milestone', '{"type":"contributions_count","value":1}', 10),
  ('ten_club', 'Ten Club', '10 confirmed submissions', '🔟', 'milestone', '{"type":"confirmations_count","value":10}', 20),
  ('century', 'Century', '100 confirmed submissions', '💯', 'milestone', '{"type":"confirmations_count","value":100}', 50),
  ('streak_7', 'Week Warrior', '7-day submission streak', '🔥', 'streak', '{"type":"streak","value":7}', 20),
  ('streak_30', 'Monthly Machine', '30-day submission streak', '⚡', 'streak', '{"type":"streak","value":30}', 100),
  ('price_hunter', 'Price Hunter', '50 product price submissions', '🏷️', 'category', '{"type":"category_count","category":"product_price","value":50}', 30),
  ('forex_spy', 'Forex Spy', '20 forex rate submissions', '💱', 'category', '{"type":"category_count","category":"forex_rate","value":20}', 30),
  ('salary_scout', 'Salary Scout', '10 salary data submissions', '💰', 'category', '{"type":"category_count","category":"salary","value":10}', 30),
  ('multi_country', 'Pan-African', 'Contribute data from 5+ countries', '🌍', 'quality', '{"type":"unique_countries","value":5}', 50),
  ('multi_category', 'Renaissance', 'Contribute in 5+ data categories', '🎨', 'quality', '{"type":"unique_categories","value":5}', 30),
  ('trust_80', 'Trusted Source', 'Reach trust score 80+', '✅', 'quality', '{"type":"trust_score","value":80}', 30),
  ('first_cashout', 'Paid!', 'Complete your first cashout', '🤑', 'milestone', '{"type":"cashout_count","value":1}', 0),
  ('referrer', 'Recruiter', 'Refer 3 active contributors', '🤝', 'milestone', '{"type":"referral_count","value":3}', 30),
  ('country_pioneer', 'Country Pioneer', 'First person to submit data for a new country', '🏴', 'country', '{"type":"country_pioneer","value":1}', 50),
  ('city_pioneer', 'City Pioneer', 'First person to submit data for a new city', '🏙️', 'country', '{"type":"city_pioneer","value":1}', 25)
ON CONFLICT (id) DO NOTHING;
