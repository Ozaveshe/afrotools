SET LOCAL lock_timeout = '3s';

ALTER TABLE public.recipes
  ADD COLUMN wait_time_minutes integer NOT NULL DEFAULT 0 CHECK (wait_time_minutes >= 0),
  ADD COLUMN serving_plan text,
  ALTER COLUMN total_time_minutes SET EXPRESSION AS (prep_time_minutes + cook_time_minutes + wait_time_minutes);

DO $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.recipes AS r
  SET prep_time_minutes = p.prep, cook_time_minutes = p.cook,
      wait_time_minutes = p.wait, serving_plan = p.plan
  FROM (VALUES
    ('akara-ng', 45, 25, 180, 'Start about 4 hours 10 minutes before serving. Soak the beans for 3 hours, then allow 45 minutes to peel, blend and whip. Fry for about 25 minutes in batches, using the 5-minute timer for each batch. Serve hot.'),
    ('karkanji-td', 10, 15, 38, 'Start about 1 hour before serving. Allow 10 minutes to prepare and sweeten, 15 minutes to heat and simmer, 8 minutes to steep off the heat and at least 30 minutes to chill. Serve over ice once cold.'),
    ('masa-waina-ng', 40, 25, 600, 'Soak the rice the night before for about 8 hours. The next day, allow 40 minutes for preparation, 2 hours for the blended batter to rise and 25 minutes to cook in batches. Serve warm when golden.'),
    ('milk-tart-za', 30, 40, 180, 'Start about 4 hours 10 minutes before slicing, with the pastry shell ready. Allow 30 minutes for preparation and 40 minutes for the milk and custard stages. Chill the filled tart for at least 3 hours, until set.'),
    ('poulet-bicyclette-bf', 30, 40, 125, 'Start at least 3 hours 15 minutes before serving, or marinate the night before. Allow 30 minutes for prep, at least 2 hours in the fridge, about 40 minutes to grill and 5 minutes to rest before carving.'),
    ('poulet-yassa-gn', 30, 67, 120, 'Start about 3 hours 40 minutes before serving. After 30 minutes of prep, refrigerate the chicken in its marinade for at least 2 hours. Allow 12 minutes to brown the chicken, 25 minutes for the onions and 30 minutes to simmer. Have the rice ready when the sauce thickens.'),
    ('sosaties-za', 20, 25, 260, 'Start about 5 hours before serving, or marinate the lamb the night before. Allow 10 minutes to cook the marinade and about 20 minutes to cool it fully. Refrigerate the coated lamb for at least 4 hours. Allow 20 minutes for prep and threading, then grill for about 15 minutes.'),
    ('taameya-eg', 35, 20, 480, 'Soak the beans the night before for about 8 hours. Before serving, allow 35 minutes to drain, grind and shape, then 20 minutes to fry in batches. The 4-minute timer is for one batch. Serve hot.')
  ) AS p(slug, prep, cook, wait, plan)
  WHERE r.slug = p.slug AND r.is_published AND r.is_verified;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 8 THEN
    RAISE EXCEPTION 'Expected eight published recipes, found %', updated_count;
  END IF;
END $$;
