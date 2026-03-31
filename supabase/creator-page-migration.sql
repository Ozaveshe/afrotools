-- ============================================================
-- CreatorPage — Link Page & Digital Storefront
-- Tables: creator_pages, creator_page_blocks, creator_page_products,
--         creator_page_analytics, creator_page_subscribers
-- ============================================================

-- ── creator_pages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE,
  display_name  TEXT NOT NULL DEFAULT 'My Page',
  bio           TEXT DEFAULT '',
  avatar_url    TEXT DEFAULT '',
  location      TEXT DEFAULT '',
  social_links  JSONB DEFAULT '{}'::jsonb,

  -- Appearance
  theme           TEXT NOT NULL DEFAULT 'clean',
  accent_color    TEXT NOT NULL DEFAULT '#F43F5E',
  font_pairing    TEXT NOT NULL DEFAULT 'default',
  button_style    TEXT NOT NULL DEFAULT 'pill',
  button_fill     TEXT NOT NULL DEFAULT 'solid',
  background_type TEXT NOT NULL DEFAULT 'solid',
  background_value TEXT NOT NULL DEFAULT '#ffffff',

  -- Status
  is_published  BOOLEAN NOT NULL DEFAULT false,
  share_token   TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),

  -- Payment
  payment_methods JSONB DEFAULT '[]'::jsonb,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_creator_pages_user    ON creator_pages(user_id);
CREATE INDEX idx_creator_pages_username ON creator_pages(username);

ALTER TABLE creator_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pages"
  ON creator_pages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pages"
  ON creator_pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pages"
  ON creator_pages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pages"
  ON creator_pages FOR DELETE
  USING (auth.uid() = user_id);

-- Public read for published pages
CREATE POLICY "Anyone can read published pages"
  ON creator_pages FOR SELECT
  USING (is_published = true);

-- Anon insert for demo / unauthenticated use
CREATE POLICY "Anon can insert pages"
  ON creator_pages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon can update own pages"
  ON creator_pages FOR UPDATE
  USING (true);


-- ── creator_page_blocks ────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_page_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES creator_pages(id) ON DELETE CASCADE,
  block_type  TEXT NOT NULL DEFAULT 'link',
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_visible  BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_blocks_page ON creator_page_blocks(page_id, sort_order);

ALTER TABLE creator_page_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blocks visible with page"
  ON creator_page_blocks FOR SELECT
  USING (true);

CREATE POLICY "Insert blocks"
  ON creator_page_blocks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Update blocks"
  ON creator_page_blocks FOR UPDATE
  USING (true);

CREATE POLICY "Delete blocks"
  ON creator_page_blocks FOR DELETE
  USING (true);


-- ── creator_page_products ──────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_page_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id       UUID NOT NULL REFERENCES creator_pages(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Product',
  description   TEXT DEFAULT '',
  price         NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'NGN',
  image_url     TEXT DEFAULT '',
  product_type  TEXT NOT NULL DEFAULT 'download',
  file_url      TEXT DEFAULT '',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sales_count   INTEGER NOT NULL DEFAULT 0,
  revenue_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_products_page ON creator_page_products(page_id);

ALTER TABLE creator_page_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products visible with page"
  ON creator_page_products FOR SELECT
  USING (true);

CREATE POLICY "Insert products"
  ON creator_page_products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Update products"
  ON creator_page_products FOR UPDATE
  USING (true);

CREATE POLICY "Delete products"
  ON creator_page_products FOR DELETE
  USING (true);


-- ── creator_page_analytics ─────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_page_analytics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES creator_pages(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  details     JSONB DEFAULT '{}'::jsonb,
  referrer    TEXT DEFAULT '',
  user_agent  TEXT DEFAULT '',
  country     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_analytics_page   ON creator_page_analytics(page_id, created_at DESC);
CREATE INDEX idx_page_analytics_event  ON creator_page_analytics(page_id, event_type);

ALTER TABLE creator_page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics visible to page owner"
  ON creator_page_analytics FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert analytics"
  ON creator_page_analytics FOR INSERT
  WITH CHECK (true);


-- ── creator_page_subscribers ───────────────────────────────
CREATE TABLE IF NOT EXISTS creator_page_subscribers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id       UUID NOT NULL REFERENCES creator_pages(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_id, email)
);

CREATE INDEX idx_page_subscribers_page ON creator_page_subscribers(page_id);

ALTER TABLE creator_page_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers visible to page owner"
  ON creator_page_subscribers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can subscribe"
  ON creator_page_subscribers FOR INSERT
  WITH CHECK (true);
