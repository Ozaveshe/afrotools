-- ============================================================
-- CREATOR SUITE — Full Migration
-- Applied 2026-03-31 to zpclagtgczsygrgztlts (AfroTools Auth Instance)
-- 28 tables across 8 migrations
-- ============================================================

-- ============================================================
-- 1. PERSONA INFRASTRUCTURE (shared across all future suites)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, persona_type)
);

CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  craft TEXT,
  specialties JSONB DEFAULT '[]',
  stage TEXT CHECK (stage IN ('starting','side_income','full_time','agency')),
  platforms JSONB DEFAULT '[]',
  audience_country TEXT,
  primary_currency TEXT DEFAULT 'NGN',
  vat_registered BOOLEAN DEFAULT FALSE,
  hourly_rate INTEGER,
  ai_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 2. CREATOR CLIENTS (shared across invoice, desk, money, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS creator_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  country_code TEXT,
  billing_address TEXT,
  notes TEXT,
  total_invoiced BIGINT DEFAULT 0,
  total_paid BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. CREATOR INVOICES
-- ============================================================

CREATE TABLE IF NOT EXISTS creator_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES creator_clients(id),
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','paid','overdue','cancelled')),
  currency TEXT NOT NULL DEFAULT 'NGN',
  subtotal BIGINT NOT NULL DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC,
  tax_rate NUMERIC DEFAULT 0,
  tax_number TEXT,
  total BIGINT NOT NULL DEFAULT 0,
  amount_paid BIGINT DEFAULT 0,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  payment_instructions TEXT,
  client_name TEXT,
  client_email TEXT,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES creator_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price BIGINT NOT NULL,
  total BIGINT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS creator_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES creator_clients(id),
  quote_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','declined','expired','converted')),
  currency TEXT NOT NULL DEFAULT 'NGN',
  subtotal BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  valid_until DATE,
  cover_letter TEXT,
  converted_invoice_id UUID REFERENCES creator_invoices(id),
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES creator_quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price BIGINT NOT NULL,
  total BIGINT NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- 4. CREATOR KIT (Media Kit & Rate Card)
-- ============================================================

CREATE TABLE IF NOT EXISTS creator_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template TEXT NOT NULL DEFAULT 'bold',
  title TEXT,
  tagline TEXT,
  bio_short TEXT,
  bio_medium TEXT,
  bio_long TEXT,
  accent_color TEXT DEFAULT '#F5A623',
  font_pairing TEXT DEFAULT 'default',
  social_links JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{}',
  past_clients JSONB DEFAULT '[]',
  testimonials JSONB DEFAULT '[]',
  contact_email TEXT,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  booking_url TEXT,
  cta_text TEXT DEFAULT 'Let''s Work Together',
  section_order JSONB DEFAULT '["hero","about","portfolio","stats","services","clients","testimonials","contact"]',
  hidden_sections JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  view_count INTEGER DEFAULT 0,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_kit_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES creator_kits(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  client_name TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Rate Card',
  services JSONB NOT NULL DEFAULT '[]',
  packages JSONB DEFAULT '[]',
  currency TEXT NOT NULL DEFAULT 'NGN',
  show_prices BOOLEAN DEFAULT TRUE,
  accent_color TEXT DEFAULT '#F5A623',
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. CREATOR CALENDAR (Content Calendar & Planner)
-- ============================================================

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

CREATE TABLE IF NOT EXISTS creator_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','tiktok','youtube','twitter','linkedin','facebook','newsletter')),
  handle TEXT,
  follower_count INTEGER,
  best_posting_times JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CREATOR MONEY (Finance Tracker)
-- ============================================================

CREATE TABLE IF NOT EXISTS creator_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  source TEXT NOT NULL CHECK (source IN ('client','brand_deal','digital_product','platform','workshop','gift','other')),
  description TEXT,
  client_id UUID REFERENCES creator_clients(id),
  invoice_id UUID REFERENCES creator_invoices(id),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'receipt',
  color TEXT NOT NULL DEFAULT '#64748b',
  is_deductible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS creator_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  category_id UUID REFERENCES creator_expense_categories(id),
  description TEXT,
  vendor TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_business_expense BOOLEAN DEFAULT TRUE,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount BIGINT NOT NULL,
  current_amount BIGINT DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','reached','abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. CREATOR DESK (Client & Project Manager)
-- ============================================================

CREATE TABLE IF NOT EXISTS creator_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES creator_clients(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead','quoted','active','review','completed','on_hold','cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  value BIGINT,
  currency TEXT DEFAULT 'NGN',
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  quote_id UUID REFERENCES creator_quotes(id),
  invoice_id UUID REFERENCES creator_invoices(id),
  deliverables_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES creator_projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES creator_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'manual' CHECK (note_type IN ('manual','system','ai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES creator_projects(id),
  client_id UUID REFERENCES creator_clients(id),
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. CREATOR PAGE (Link Page & Digital Storefront)
-- ============================================================

CREATE TABLE IF NOT EXISTS creator_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  social_links JSONB DEFAULT '{}',
  theme TEXT DEFAULT 'clean',
  accent_color TEXT DEFAULT '#F43F5E',
  font_pairing TEXT DEFAULT 'default',
  button_style TEXT DEFAULT 'pill',
  background_type TEXT DEFAULT 'solid',
  background_value TEXT DEFAULT '#ffffff',
  custom_css TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES creator_pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('link','product','tip_jar','email_signup','booking','content','testimonial','text','spacer')),
  content JSONB NOT NULL DEFAULT '{}',
  is_visible BOOLEAN DEFAULT TRUE,
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_page_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES creator_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed','pay_what_you_want','free')),
  min_price BIGINT,
  product_type TEXT DEFAULT 'download' CHECK (product_type IN ('download','booking','redirect')),
  file_url TEXT,
  redirect_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sales_count INTEGER DEFAULT 0,
  revenue_total BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES creator_pages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','link_click','product_view','product_purchase','email_signup')),
  block_id UUID REFERENCES creator_page_blocks(id),
  product_id UUID REFERENCES creator_page_products(id),
  referrer TEXT,
  country TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_page_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES creator_pages(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. CREATOR PRICING (Smart Pricing Calculator)
-- ============================================================

CREATE TABLE IF NOT EXISTS creator_pricing_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  craft TEXT NOT NULL,
  specialty TEXT,
  country_code TEXT NOT NULL,
  city TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner','developing','established','expert','master')),
  rate_type TEXT NOT NULL CHECK (rate_type IN ('hourly','daily','project','per_unit')),
  rate_min INTEGER,
  rate_max INTEGER,
  rate_median INTEGER,
  currency TEXT NOT NULL,
  sample_size INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS creator_pricing_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  craft TEXT NOT NULL,
  specialty TEXT,
  project_description TEXT,
  country_code TEXT,
  city TEXT,
  experience_level TEXT,
  calculated_rate_min INTEGER,
  calculated_rate_max INTEGER,
  currency TEXT DEFAULT 'NGN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
