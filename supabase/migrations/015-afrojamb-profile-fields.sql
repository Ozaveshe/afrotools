-- ============================================================
-- 015: Add AfroJAMB + Education Hub profile fields
-- Target: AUTH instance (public.profiles)
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_best_mock_score INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_predicted_score INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_practice_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_total_study_minutes INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_target_subjects TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_target_universities TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_target_courses TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_weak_topics TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_streak_days INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jamb_score_source TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS graduation_date TEXT;

COMMENT ON COLUMN public.profiles.jamb_best_mock_score IS 'Best AfroJAMB CBT aggregate recorded locally or via sync';
COMMENT ON COLUMN public.profiles.jamb_predicted_score IS 'Latest predicted JAMB aggregate from the score predictor';
COMMENT ON COLUMN public.profiles.jamb_practice_count IS 'Number of AfroJAMB CBT mocks taken';
COMMENT ON COLUMN public.profiles.jamb_total_study_minutes IS 'Accumulated mock/study minutes tracked by AfroJAMB';
COMMENT ON COLUMN public.profiles.jamb_target_subjects IS 'Selected JAMB subject combination';
COMMENT ON COLUMN public.profiles.jamb_target_universities IS 'Preferred university targets for admissions planning';
COMMENT ON COLUMN public.profiles.jamb_target_courses IS 'Preferred course targets for admissions planning';
COMMENT ON COLUMN public.profiles.jamb_weak_topics IS 'User-declared weak topics for planning and tutoring';
COMMENT ON COLUMN public.profiles.jamb_streak_days IS 'Current AfroJAMB study streak in days';
COMMENT ON COLUMN public.profiles.jamb_score_source IS 'Which tool most recently set jamb_score: predictor, cbt-mock, or post-utme';
COMMENT ON COLUMN public.profiles.graduation_date IS 'Education Hub graduation month in YYYY-MM format';
