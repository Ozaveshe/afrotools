-- =====================================================
-- AfroTools Education Cloud Sync Tables
-- Stores GPA records, flashcard decks, and study plans
-- linked to authenticated users
-- =====================================================

-- GPA Records: semesters, courses, grades
CREATE TABLE IF NOT EXISTS education_gpa_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grading_system TEXT NOT NULL DEFAULT 'nigerian_federal',
  semesters JSONB NOT NULL DEFAULT '[]',
  -- semesters: [{ name, courses: [{ name, credits, grade }] }]
  cgpa DECIMAL(4,2),
  total_credits INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Flashcard Decks: deck name, cards array
CREATE TABLE IF NOT EXISTS education_flashcard_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_name TEXT NOT NULL,
  cards JSONB NOT NULL DEFAULT '[]',
  -- cards: [{ front, back, mastered, reviewCount }]
  card_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, deck_name)
);

-- Study Plans: subjects, preferences, generated timetable
CREATE TABLE IF NOT EXISTS education_study_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'My Plan',
  subjects JSONB NOT NULL DEFAULT '[]',
  -- subjects: [{ name, difficulty, examDate, hoursPerWeek }]
  preferences JSONB NOT NULL DEFAULT '{}',
  -- preferences: { hoursPerDay, breakDuration, startTime, daysPerWeek }
  timetable JSONB,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan_name)
);

-- Row Level Security
ALTER TABLE education_gpa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_study_plans ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can manage own GPA records"
  ON education_gpa_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own flashcard decks"
  ON education_flashcard_decks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own study plans"
  ON education_study_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for fast user lookups
CREATE INDEX IF NOT EXISTS idx_gpa_records_user ON education_gpa_records(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user ON education_flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON education_study_plans(user_id);
