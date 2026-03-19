-- ============================================================
-- 006: Extend Profiles Table
-- Target: AUTH instance (zpclagtgczsygrgztlts.supabase.co)
-- ============================================================

-- Add new columns (IF NOT EXISTS prevents errors if already present)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_income_range TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paystack_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_tools TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calculation_count INTEGER DEFAULT 0;

-- Comments for documentation
COMMENT ON COLUMN public.profiles.employment_type IS 'employed, self-employed, freelancer, business-owner';
COMMENT ON COLUMN public.profiles.monthly_income_range IS 'under-100k, 100k-500k, 500k-1m, 1m-5m, 5m-plus (local currency)';
COMMENT ON COLUMN public.profiles.subscription_tier IS 'free or pro';
