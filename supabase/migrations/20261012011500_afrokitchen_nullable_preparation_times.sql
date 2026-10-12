-- Unknown household preparation times are NULL, never invented zero-minute values.
-- Existing known durations and the generated total expression remain unchanged.
BEGIN;
ALTER TABLE public.recipes
  ALTER COLUMN prep_time_minutes DROP NOT NULL,
  ALTER COLUMN cook_time_minutes DROP NOT NULL;
COMMENT ON COLUMN public.recipes.prep_time_minutes IS
  'Preparation minutes when supported by the recipe source; NULL means unspecified.';
COMMENT ON COLUMN public.recipes.cook_time_minutes IS
  'Cooking minutes when supported by the recipe source; NULL means unspecified.';
COMMIT;
