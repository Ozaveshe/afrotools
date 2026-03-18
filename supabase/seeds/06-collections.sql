DO $$
DECLARE
  col_id UUID;
  recipe_ids UUID[];
BEGIN
  -- Collection 1: Party Favorites
  SELECT ARRAY_AGG(id) INTO recipe_ids FROM recipes WHERE slug IN (
    'nigerian-jollof-rice', 'ghanaian-waakye', 'senegalese-thieboudienne',
    'south-african-bobotie', 'ethiopian-doro-wat', 'moroccan-chicken-tagine',
    'kenyan-pilau', 'congolese-moambe-chicken', 'cameroonian-ndole',
    'tanzanian-pilau'
  );
  INSERT INTO collections (slug, name, description, recipe_ids, is_featured)
  VALUES ('party-favorites', 'Party Favorites', 'Festive dishes that bring people together. These crowd-pleasers are served at celebrations across Africa.', recipe_ids, true);

  -- Collection 2: Quick & Easy (Under 30 min)
  SELECT ARRAY_AGG(id) INTO recipe_ids FROM recipes WHERE (prep_time_minutes + cook_time_minutes) <= 30 LIMIT 12;
  INSERT INTO collections (slug, name, description, recipe_ids, is_featured)
  VALUES ('quick-and-easy', 'Quick & Easy', 'Delicious African dishes ready in 30 minutes or less. Perfect for busy weeknight dinners.', recipe_ids, true);

  -- Collection 3: Vegetarian Africa
  SELECT ARRAY_AGG(id) INTO recipe_ids FROM recipes WHERE 'vegetarian' = ANY(diet_tags) OR 'vegan' = ANY(diet_tags) LIMIT 12;
  INSERT INTO collections (slug, name, description, recipe_ids, is_featured)
  VALUES ('vegetarian-africa', 'Vegetarian Africa', 'Plant-based dishes from across the continent. African cuisine has a rich tradition of meatless cooking.', recipe_ids, true);

  -- Collection 4: Street Food
  SELECT ARRAY_AGG(id) INTO recipe_ids FROM recipes WHERE category = 'snack' OR 'street-food' = ANY(tags) LIMIT 12;
  INSERT INTO collections (slug, name, description, recipe_ids, is_featured)
  VALUES ('street-food', 'Street Food', 'Popular street snacks and quick bites found at markets and roadside stalls across Africa.', recipe_ids, false);

  -- Collection 5: One-Pot Wonders
  SELECT ARRAY_AGG(id) INTO recipe_ids FROM recipes WHERE 'one-pot' = ANY(tags) OR 'rice' = ANY(tags) LIMIT 12;
  INSERT INTO collections (slug, name, description, recipe_ids, is_featured)
  VALUES ('one-pot-wonders', 'One-Pot Wonders', 'Hearty single-pot dishes that are easy to make and full of flavor. Less cleanup, more taste.', recipe_ids, false);

  -- Collection 6: Sunday Specials
  SELECT ARRAY_AGG(id) INTO recipe_ids FROM recipes WHERE difficulty = 'hard' OR 'celebration' = ANY(tags) OR 'sunday' = ANY(tags) LIMIT 12;
  INSERT INTO collections (slug, name, description, recipe_ids, is_featured)
  VALUES ('sunday-specials', 'Sunday Specials', 'Elaborate weekend dishes worth the extra effort. These are the recipes that make Sunday lunch special.', recipe_ids, false);
END $$;
