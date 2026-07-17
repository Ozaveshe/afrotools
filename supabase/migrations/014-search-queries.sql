-- Migration 014: Search Queries table for product intelligence
-- Captures all search queries (especially failed ones) to understand what tools users want.

CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'navbar',
  country_code TEXT,
  page_url TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries (query);
CREATE INDEX IF NOT EXISTS idx_search_queries_results_count ON search_queries (results_count);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries (created_at DESC);

-- RLS: anonymous INSERT only, SELECT restricted to service_role
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_search_queries"
  ON search_queries
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "service_role_select_search_queries"
  ON search_queries
  FOR SELECT
  TO service_role
  USING (true);
