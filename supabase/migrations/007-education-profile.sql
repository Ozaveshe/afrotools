-- ============================================================
-- 007: Add Education Fields to Profiles
-- Target: AUTH instance (zpclagtgczsygrgztlts.supabase.co)
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gpa_value NUMERIC(4,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gpa_scale TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_study_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_countries TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_fields TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ielts_overall NUMERIC(3,1);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ielts_components JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_score INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT;

-- Comments
COMMENT ON COLUMN public.profiles.education_level IS 'secondary, undergrad, masters, phd, working';
COMMENT ON COLUMN public.profiles.gpa_scale IS '4.0, 5.0, percentage, 20';
COMMENT ON COLUMN public.profiles.target_study_level IS 'undergrad, masters, phd';
COMMENT ON COLUMN public.profiles.target_countries IS 'ISO destination codes: uk, us, eu, canada, australia, africa, global';
COMMENT ON COLUMN public.profiles.target_fields IS 'stem, business, health, law, arts, agric, any';
COMMENT ON COLUMN public.profiles.ielts_components IS '{"listening":7,"reading":6.5,"writing":6,"speaking":7}';
