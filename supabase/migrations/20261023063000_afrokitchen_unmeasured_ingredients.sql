-- Preserve source quantities that are explicitly unmeasured, without turning them into zero.
-- Existing rows retain their measured amount and receive source_quantity_unrecorded=false.
BEGIN;
ALTER TABLE public.recipe_ingredients
  ADD COLUMN source_quantity_unrecorded boolean NOT NULL DEFAULT false,
  ALTER COLUMN amount DROP NOT NULL,
  ADD CONSTRAINT recipe_ingredients_quantity_recorded CHECK (
    (source_quantity_unrecorded AND amount IS NULL) OR
    (NOT source_quantity_unrecorded AND amount IS NOT NULL)
  );
COMMIT;
