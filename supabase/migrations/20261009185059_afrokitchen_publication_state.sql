-- Publication eligibility is independent of culinary verification.
-- Existing consumers continue to use is_verified until the matching source release.
-- Deploy the source and assets before withdrawing verification on corrected rows.
BEGIN;

LOCK TABLE public.recipes IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE public.recipes
  ADD COLUMN is_published boolean NOT NULL DEFAULT false;

UPDATE public.recipes
SET is_published = true
WHERE is_verified IS TRUE;

COMMENT ON COLUMN public.recipes.is_published IS
  'Editorial publication eligibility. This does not establish kitchen testing, nutrition accuracy, or method safety.';
COMMENT ON COLUMN public.recipes.is_verified IS
  'Verification flag, independent of publication eligibility. Do not infer verification from publication or an illustration.';

COMMIT;
