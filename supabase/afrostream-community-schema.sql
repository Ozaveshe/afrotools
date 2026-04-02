-- ================================================================
-- AfroStream Community Layer — Submissions + AfroPoints Foundation
-- Instance: AUTH (zpclagtgczsygrgztlts)
-- Tables: as_submissions, as_upvotes, as_points_profiles, as_points_ledger, as_badges
-- Applied: 2026-04-01
-- ================================================================

-- ── SUBMISSIONS (pending user entries) ──────────────────────────
CREATE TABLE IF NOT EXISTS as_submissions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID,                                    -- auth.users.id (nullable for anonymous)
  user_email    TEXT,                                     -- for contact / display
  user_name     TEXT NOT NULL,                            -- display name of submitter
  type          TEXT NOT NULL DEFAULT 'creator',          -- creator | stream | news_tip | correction
  status        TEXT NOT NULL DEFAULT 'pending',          -- pending | approved | rejected
  payload       JSONB NOT NULL DEFAULT '{}',              -- all field data lives here
  admin_note    TEXT,                                     -- reason for reject, or edit note
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   TEXT,                                     -- admin name/id
  ip_hash       TEXT,                                     -- hashed IP for rate limiting
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── UPVOTES (fans vote for creators) ────────────────────────────
CREATE TABLE IF NOT EXISTS as_upvotes (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id    BIGINT NOT NULL REFERENCES as_creators(id) ON DELETE CASCADE,
  user_id       UUID,
  ip_hash       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, user_id),
  UNIQUE(creator_id, ip_hash)
);

-- ── POINTS PROFILES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS as_points_profiles (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID UNIQUE NOT NULL,
  display_name  TEXT,
  country       TEXT,
  total_points  INT DEFAULT 0,
  rank          TEXT DEFAULT 'Newcomer',
  trust_score   INT DEFAULT 50,
  streak_days   INT DEFAULT 0,
  last_active   TIMESTAMPTZ DEFAULT NOW(),
  badges        JSONB DEFAULT '[]',
  submissions_count    INT DEFAULT 0,
  approved_count       INT DEFAULT 0,
  rejected_count       INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── POINTS LEDGER ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS as_points_ledger (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL,
  points        INT NOT NULL,
  reason        TEXT NOT NULL,
  reference_id  BIGINT,
  reference_type TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── BADGES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS as_badges (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  emoji         TEXT NOT NULL DEFAULT '🏅',
  category      TEXT NOT NULL DEFAULT 'milestone',
  unlock_condition TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 10 default badges seeded on creation
-- See migration for full INSERT statement
