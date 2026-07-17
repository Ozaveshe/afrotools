-- AfroKitchen Seed Data — Batch 1: West Africa
-- 17 countries × 3 recipes = 51 recipes

-- =============================================
-- NIGERIA (NG)
-- =============================================

-- 1. Jollof Rice (Nigeria)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'jollof-rice-ng', 'Jollof Rice', 'Jollof', 'Nigeria''s iconic one-pot rice dish cooked in a smoky tomato and pepper sauce. The rice absorbs layers of flavour from blended tomatoes, scotch bonnets, and a signature party smokiness.',
    'NG', 'Nigeria', 'West Africa', 'Yoruba', 'main',
    ARRAY['rice','one-pot','party','tomato','nigeria'],
    ARRAY['gluten-free','dairy-free','halal'],
    30, 60, 'medium', 6,
    'Jollof Rice is the undisputed king of Nigerian party food. No owambe (Yoruba party) is complete without it. The debate over whether Nigerian or Ghanaian Jollof is superior has become one of West Africa''s most passionate cultural rivalries.',
    'Parties and celebrations', 'Fried plantain, coleslaw, and grilled chicken',
    480, 12, 72, 16, 4,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Base', 3, 'cups', 'long-grain parboiled rice', 'washed until water runs clear', false, 'basmati rice'),
  (rid, 2, 'Base', 6, 'medium', 'Roma tomatoes', 'roughly chopped', false, NULL),
  (rid, 3, 'Base', 3, 'medium', 'red bell peppers', 'deseeded and chopped', false, 'tatashe peppers'),
  (rid, 4, 'Base', 2, 'whole', 'scotch bonnet peppers', NULL, false, 'habanero'),
  (rid, 5, 'Base', 2, 'large', 'onions', '1 blended, 1 sliced', false, NULL),
  (rid, 6, 'Base', 0.33, 'cup', 'vegetable oil', NULL, false, NULL),
  (rid, 7, 'Base', 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 8, 'Seasoning', 2, 'tsp', 'curry powder', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Blend the base', 'Blend tomatoes, red bell peppers, scotch bonnets, and one onion until smooth. Pour into a pot and cook on medium-high heat until reduced by half.', 1800, 'Reduce tomato base', 'Frying down the tomato base is the most important step — it must lose all excess water.'),
  (rid, 2, 'Fry the base', 'Heat vegetable oil in a heavy-bottomed pot. Fry sliced onions until golden. Add tomato paste and fry for 2 minutes. Pour in the reduced tomato blend.', 600, 'Fry base', NULL),
  (rid, 3, 'Season', 'Add curry powder, thyme, bay leaves, seasoning cubes, and salt. Let the sauce fry until oil floats on top, about 10 minutes.', 600, 'Season sauce', 'When the oil separates and sits on top, your base is ready for rice.'),
  (rid, 4, 'Add rice', 'Pour in the washed rice and stir to coat every grain. Add stock or water to sit about 1cm above the rice. Cover tightly with foil then the lid.', NULL, NULL, 'The foil seal traps steam and helps the rice cook evenly.'),
  (rid, 5, 'Cook the rice', 'Cook on low heat for 30 minutes without opening the lid. Stir gently from the bottom, re-cover and cook for another 10-15 minutes until tender.', 1800, 'Cook rice', NULL),
  (rid, 6, 'Create the party smokiness', 'Increase heat to high for the last 2-3 minutes to create a slight burn at the bottom — this is the prized party jollof smoky flavour.', 150, 'Smoke the rice', 'The bottom crust is the most coveted serving at any party.');
END $$;

-- 2. Egusi Soup (Nigeria)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'egusi-soup-ng', 'Egusi Soup', 'Ofe Egusi', 'A thick, hearty soup made from ground melon seeds, leafy greens, and assorted meats. The egusi forms satisfying clumps in a rich, peppery palm oil broth.',
    'NG', 'Nigeria', 'West Africa', 'Igbo', 'soup',
    ARRAY['melon-seeds','leafy-greens','palm-oil','fufu','nigeria'],
    ARRAY['gluten-free','dairy-free'],
    25, 50, 'medium', 6,
    'Egusi Soup is a staple across southern Nigeria. The Igbo lumpy style uses balls of egusi paste, while the Yoruba style fries it smooth. It is always served with a swallow like pounded yam.',
    'Everyday meals and family gatherings', 'Pounded yam, eba, or fufu',
    520, 30, 12, 40, 6,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'ground egusi (melon seeds)', NULL, false, NULL),
  (rid, 2, NULL, 0.5, 'cup', 'palm oil', NULL, false, NULL),
  (rid, 3, NULL, 300, 'g', 'assorted beef and tripe', 'cut into pieces', false, NULL),
  (rid, 4, NULL, 200, 'g', 'stockfish', 'soaked and deboned', false, NULL),
  (rid, 5, NULL, 2, 'cups', 'chopped spinach or ugu leaves', 'washed', false, 'pumpkin leaves'),
  (rid, 6, NULL, 2, 'medium', 'onions', 'chopped', false, NULL),
  (rid, 7, NULL, 3, 'whole', 'scotch bonnet peppers', 'blended', false, NULL),
  (rid, 8, NULL, 2, 'cubes', 'seasoning cubes', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the meats', 'Season beef and tripe with onions, seasoning cubes, and salt. Boil until tender, about 25 minutes. Reserve the stock.', 1500, 'Cook meat', 'The meat stock is the flavour backbone of the soup.'),
  (rid, 2, 'Prepare egusi paste', 'Mix ground egusi with a small amount of warm water to form a thick paste.', NULL, NULL, NULL),
  (rid, 3, 'Build the soup base', 'Heat palm oil in a pot. Add chopped onions and fry until softened. Add blended peppers and cook for 10 minutes.', 600, 'Fry pepper base', NULL),
  (rid, 4, 'Add egusi', 'Scoop egusi paste in spoonfuls into the pot forming lumps. Add reserved meat stock and stir gently. Cover and simmer for 15 minutes.', 900, 'Simmer egusi', 'Do not stir too much — let the egusi clumps set.'),
  (rid, 5, 'Add meats and greens', 'Add cooked meats and stockfish. Stir gently and cook for 5 minutes. Add chopped greens and cook 3-5 minutes until wilted.', 300, 'Cook greens', 'Add greens last so they keep their colour.'),
  (rid, 6, 'Serve', 'Adjust seasoning and serve hot alongside pounded yam or any preferred swallow.', NULL, NULL, NULL);
END $$;

-- 3. Suya (Nigeria)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'suya-ng', 'Suya', 'Tsire', 'Thinly sliced beef skewers coated in a fiery, nutty spice blend called yaji, grilled over open charcoal until charred and smoky.',
    'NG', 'Nigeria', 'West Africa', 'Hausa', 'snack',
    ARRAY['grilled','street-food','spicy','skewers','nigeria'],
    ARRAY['gluten-free','dairy-free','halal'],
    40, 15, 'easy', 4,
    'Suya is the pride of the Hausa people of northern Nigeria. As evening falls across Nigerian cities, the glow of suya grills and the aroma of smoking yaji spice fill the air.',
    'Evening snack and street food', 'Sliced onions, tomatoes, and cabbage',
    380, 35, 8, 22, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Meat', 500, 'g', 'beef sirloin', 'sliced thinly against the grain', false, 'chicken breast'),
  (rid, 2, 'Yaji spice', 0.5, 'cup', 'roasted groundnut powder', 'ground fine', false, 'roasted peanut powder'),
  (rid, 3, 'Yaji spice', 1, 'tbsp', 'cayenne pepper', NULL, false, NULL),
  (rid, 4, 'Yaji spice', 1, 'tsp', 'ground ginger', NULL, false, NULL),
  (rid, 5, 'Yaji spice', 1, 'tsp', 'onion powder', NULL, false, NULL),
  (rid, 6, 'Yaji spice', 1, 'tsp', 'smoked paprika', NULL, false, NULL),
  (rid, 7, 'Serving', 1, 'medium', 'onion', 'sliced into rings', false, NULL),
  (rid, 8, 'Serving', 2, 'medium', 'tomatoes', 'sliced', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the yaji spice', 'Combine groundnut powder, cayenne, ginger, onion powder, paprika, and salt. Mix thoroughly.', NULL, NULL, 'Toast the groundnuts in a dry pan first for deeper flavour.'),
  (rid, 2, 'Prepare the meat', 'Thread thinly sliced beef onto wooden skewers. Brush with oil and coat generously with yaji spice on all sides.', NULL, NULL, 'Soak wooden skewers in water for 30 minutes to prevent burning.'),
  (rid, 3, 'Marinate', 'Let coated skewers rest for at least 30 minutes, or refrigerate up to 2 hours.', 1800, 'Marinate', NULL),
  (rid, 4, 'Grill the suya', 'Grill over high charcoal heat, turning every 2-3 minutes, until charred on edges but juicy inside. About 8-10 minutes total.', 600, 'Grill suya', NULL),
  (rid, 5, 'Serve', 'Sprinkle extra yaji spice over the grilled suya. Serve with sliced onions, tomatoes, and fresh cabbage.', NULL, NULL, NULL);
END $$;

-- =============================================
-- GHANA (GH)
-- =============================================

-- 4. Ghanaian Jollof Rice (Ghana)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'jollof-rice-gh', 'Ghanaian Jollof Rice', 'Jollof', 'Ghana''s aromatic take on the famous rice dish, distinguished by basmati rice and a fragrant tomato sauce enriched with local spices.',
    'GH', 'Ghana', 'West Africa', 'Akan', 'main',
    ARRAY['rice','one-pot','party','tomato','ghana'],
    ARRAY['gluten-free','dairy-free','halal'],
    25, 55, 'medium', 6,
    'Ghanaians stand firm that their Jollof is the world''s best. The use of basmati rice gives a distinct fluffy texture, while shito on the side adds a uniquely Ghanaian dimension.',
    'Parties, funerals, and Sunday meals', 'Shito, fried plantain, and grilled chicken',
    460, 10, 70, 14, 3,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 3, 'cups', 'basmati rice', 'washed', false, 'jasmine rice'),
  (rid, 2, NULL, 400, 'g', 'canned tomatoes', NULL, false, '6 fresh tomatoes, blended'),
  (rid, 3, NULL, 2, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 4, NULL, 2, 'medium', 'onions', '1 blended, 1 sliced', false, NULL),
  (rid, 5, NULL, 0.25, 'cup', 'vegetable oil', NULL, false, NULL),
  (rid, 6, NULL, 1, 'whole', 'scotch bonnet pepper', NULL, false, NULL),
  (rid, 7, NULL, 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 8, NULL, 1, 'thumb', 'fresh ginger', 'grated', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the sauce', 'Blend canned tomatoes, one onion, garlic, and ginger until smooth.', NULL, NULL, NULL),
  (rid, 2, 'Fry the base', 'Heat oil. Fry sliced onions until golden. Add tomato paste, fry 3 minutes. Pour in blended tomato mixture.', 600, 'Fry base', 'Tomato paste must darken before adding the blend.'),
  (rid, 3, 'Reduce the sauce', 'Cook on medium heat until thickened and oil rises to surface. Season and place whole scotch bonnet on top.', 1200, 'Reduce sauce', 'Whole scotch bonnet adds flavour without overwhelming heat.'),
  (rid, 4, 'Add rice and cook', 'Add washed rice, stir to coat. Add water to sit 2cm above rice. Cover tightly with foil and lid. Cook on low 30-35 minutes.', 2100, 'Cook rice', 'Do not lift the lid during the first 25 minutes.'),
  (rid, 5, 'Fluff and serve', 'Fluff with a fork. Remove scotch bonnet. Serve with shito, fried plantain, and protein of choice.', NULL, NULL, NULL);
END $$;

-- 5. Groundnut Soup (Ghana)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'groundnut-soup-gh', 'Groundnut Soup', 'Nkate Nkwan', 'A rich, creamy soup from roasted groundnuts simmered with tomatoes and chilli. The natural peanut oils create a velvety broth.',
    'GH', 'Ghana', 'West Africa', 'Ashanti', 'soup',
    ARRAY['peanut','creamy','comfort-food','ghana'],
    ARRAY['gluten-free','dairy-free'],
    20, 45, 'medium', 6,
    'Groundnut Soup is beloved comfort food across Ghana, particularly among the Ashanti people. It showcases the importance of groundnuts in West African cuisine.',
    'Everyday meals', 'Fufu or rice balls',
    550, 32, 18, 38, 5,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'cup', 'natural peanut butter', 'smooth, unsweetened', false, 'ground roasted peanuts'),
  (rid, 2, NULL, 500, 'g', 'chicken pieces', 'skin on', false, 'goat meat'),
  (rid, 3, NULL, 4, 'medium', 'tomatoes', 'blended', false, NULL),
  (rid, 4, NULL, 1, 'large', 'onion', 'chopped', false, NULL),
  (rid, 5, NULL, 2, 'whole', 'scotch bonnet peppers', NULL, false, NULL),
  (rid, 6, NULL, 1, 'thumb', 'fresh ginger', 'grated', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the chicken', 'Season chicken with salt, onion, and ginger. Boil until tender, about 25 minutes. Reserve the stock.', 1500, 'Boil chicken', NULL),
  (rid, 2, 'Prepare tomato base', 'Blend tomatoes, scotch bonnet, and remaining onion. Cook until reduced, about 15 minutes.', 900, 'Reduce tomatoes', NULL),
  (rid, 3, 'Add groundnut paste', 'Dissolve peanut butter in 2 cups reserved stock. Pour into the tomato base.', NULL, NULL, 'Mix peanut butter in stock first to prevent lumps.'),
  (rid, 4, 'Simmer the soup', 'Add cooked chicken and remaining stock. Simmer 20 minutes, stirring occasionally.', 1200, 'Simmer soup', NULL),
  (rid, 5, 'Serve', 'Ladle into bowls with fufu or rice balls.', NULL, NULL, NULL);
END $$;

-- 6. Kelewele (Ghana)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kelewele-gh', 'Kelewele', 'Kelewele', 'Spiced fried plantain cubes seasoned with ginger, chilli, and cloves. Crispy outside, sweet and soft inside — Ghana''s favourite evening street snack.',
    'GH', 'Ghana', 'West Africa', 'Ga', 'snack',
    ARRAY['plantain','fried','street-food','spicy','ghana'],
    ARRAY['vegan','gluten-free','dairy-free'],
    15, 10, 'easy', 4,
    'Kelewele vendors are a common sight on Ghanaian streets at dusk. The combination of sweet ripe plantain with warming spices makes it irresistibly addictive.',
    'Evening snack', 'Roasted peanuts',
    320, 2, 52, 12, 4,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 4, 'whole', 'ripe plantains', 'cut into 2cm cubes', false, NULL),
  (rid, 2, NULL, 1, 'tbsp', 'fresh ginger', 'grated', false, NULL),
  (rid, 3, NULL, 0.5, 'tsp', 'cayenne pepper', NULL, false, NULL),
  (rid, 4, NULL, 0.25, 'tsp', 'ground cloves', NULL, false, NULL),
  (rid, 5, NULL, 0.5, 'tsp', 'ground nutmeg', NULL, false, NULL),
  (rid, 6, NULL, 2, 'cups', 'vegetable oil', 'for deep frying', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Season the plantain', 'Combine plantain cubes with ginger, cayenne, cloves, nutmeg, and salt. Toss and let sit 10 minutes.', 600, 'Marinate', 'Plantains should be ripe with black spots.'),
  (rid, 2, 'Heat the oil', 'Heat oil to 180C. Test with a small piece — it should sizzle immediately.', NULL, NULL, NULL),
  (rid, 3, 'Fry the kelewele', 'Fry in batches for 3-4 minutes per batch until golden brown and crispy.', 240, 'Fry plantain', NULL),
  (rid, 4, 'Drain and serve', 'Drain on paper towels. Serve hot with roasted peanuts.', NULL, NULL, 'Best eaten immediately while still hot.');
END $$;

-- =============================================
-- SENEGAL (SN)
-- =============================================

-- 7. Thieboudienne (Senegal)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'thieboudienne-sn', 'Thieboudienne', 'Thieboudienne', 'Senegal''s national dish — rice cooked in a rich tomato sauce with stuffed fish and vegetables including cassava, eggplant, and cabbage.',
    'SN', 'Senegal', 'West Africa', 'Wolof', 'main',
    ARRAY['rice','fish','one-pot','tomato','senegal'],
    ARRAY['gluten-free','dairy-free','pescatarian'],
    40, 70, 'hard', 8,
    'Thieboudienne was created by Penda Mbaye of Saint-Louis and was inscribed on UNESCO''s Intangible Cultural Heritage list in 2021. Families gather around a large communal platter.',
    'Sunday family lunch', 'Lime wedges and chilli sauce',
    560, 35, 65, 18, 7,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Fish', 1, 'kg', 'whole grouper or sea bass', 'cleaned, scored', false, 'any firm white fish'),
  (rid, 2, 'Rof stuffing', 3, 'tbsp', 'parsley', 'finely chopped', false, NULL),
  (rid, 3, 'Rof stuffing', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 4, 'Base', 3, 'cups', 'broken rice', 'washed', false, 'long-grain rice'),
  (rid, 5, 'Base', 0.33, 'cup', 'tomato paste', NULL, false, NULL),
  (rid, 6, 'Vegetables', 1, 'medium', 'cassava', 'peeled and quartered', false, NULL),
  (rid, 7, 'Vegetables', 1, 'medium', 'eggplant', 'halved', false, NULL),
  (rid, 8, 'Vegetables', 0.25, 'head', 'cabbage', 'quartered', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Stuff the fish', 'Blend parsley, garlic, scotch bonnet, and lime juice to make the rof. Fill the scored slits with this paste.', NULL, NULL, 'Pack the rof tightly into the fish cuts.'),
  (rid, 2, 'Fry the fish', 'Heat oil in a large pot. Fry stuffed fish on both sides until browned. Remove and set aside.', 600, 'Fry fish', NULL),
  (rid, 3, 'Build the sauce', 'Fry onions until soft. Add tomato paste and cook 5 minutes. Add water, tamarind, and dried fish for depth.', 900, 'Cook sauce', NULL),
  (rid, 4, 'Cook the vegetables', 'Add cassava, eggplant, and cabbage. Simmer until tender, about 20 minutes. Remove and set aside.', 1200, 'Cook vegetables', NULL),
  (rid, 5, 'Cook the rice', 'Add washed rice to remaining sauce with enough water. Cover tightly and cook on low 25-30 minutes.', 1800, 'Cook rice', NULL),
  (rid, 6, 'Assemble and serve', 'Mound rice on a large platter. Place fish in centre, surround with vegetables. Serve with lime wedges.', NULL, NULL, NULL);
END $$;

-- 8. Chicken Yassa (Senegal)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'yassa-poulet-sn', 'Chicken Yassa', 'Yassa Poulet', 'Grilled chicken smothered in a tangy caramelised onion and lemon sauce. The sharp citrus and sweet onion combination is distinctly Senegalese.',
    'SN', 'Senegal', 'West Africa', 'Jola', 'main',
    ARRAY['chicken','lemon','onion','grilled','senegal'],
    ARRAY['gluten-free','dairy-free','halal'],
    30, 50, 'medium', 6,
    'Yassa originates from the Casamance region in southern Senegal. It was traditionally prepared for celebrations and has become one of Senegal''s most popular dishes internationally.',
    'Celebrations and gatherings', 'White rice and a simple salad',
    420, 38, 15, 22, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1.5, 'kg', 'chicken pieces', 'leg and thigh portions', false, NULL),
  (rid, 2, NULL, 6, 'large', 'onions', 'thinly sliced', false, NULL),
  (rid, 3, NULL, 4, 'whole', 'lemons', 'juiced', false, 'limes'),
  (rid, 4, NULL, 3, 'tbsp', 'Dijon mustard', NULL, false, NULL),
  (rid, 5, NULL, 0.25, 'cup', 'vegetable oil', NULL, false, NULL),
  (rid, 6, NULL, 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 7, NULL, 1, 'whole', 'scotch bonnet pepper', 'whole', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Marinate the chicken', 'Combine chicken with lemon juice, half the onions, mustard, garlic, salt, and pepper. Refrigerate at least 2 hours.', 7200, 'Marinate', 'Overnight marination is best.'),
  (rid, 2, 'Grill the chicken', 'Remove chicken from marinade (reserve it). Grill until golden and slightly charred, about 15 minutes.', 900, 'Grill chicken', NULL),
  (rid, 3, 'Caramelise the onions', 'Heat oil. Add all onions and cook on medium-low until deeply caramelised, about 25 minutes.', 1500, 'Caramelise onions', 'Low and slow is the key.'),
  (rid, 4, 'Combine and simmer', 'Add grilled chicken, reserved marinade, and whole scotch bonnet. Cover and simmer 20 minutes.', 1200, 'Simmer', NULL),
  (rid, 5, 'Serve', 'Serve chicken smothered in onion sauce over fluffy white rice.', NULL, NULL, NULL);
END $$;

-- 9. Mafe (Senegal)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'mafe-sn', 'Mafe', 'Mafé', 'A hearty groundnut stew with tender meat and root vegetables in a thick, creamy peanut and tomato sauce.',
    'SN', 'Senegal', 'West Africa', 'Mandinka', 'stew',
    ARRAY['peanut','stew','comfort-food','senegal'],
    ARRAY['gluten-free','dairy-free','halal'],
    20, 60, 'medium', 6,
    'Mafe is a Mandinka dish now a staple across Senegal and West Africa. The creamy groundnut sauce celebrates the peanut, one of the region''s most important crops.',
    'Everyday family meals', 'White rice',
    520, 30, 28, 32, 6,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'beef chuck', 'cut into chunks', false, 'lamb or chicken'),
  (rid, 2, NULL, 0.75, 'cup', 'natural peanut butter', 'smooth', false, NULL),
  (rid, 3, NULL, 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 4, NULL, 2, 'medium', 'sweet potatoes', 'peeled and cubed', false, NULL),
  (rid, 5, NULL, 1, 'medium', 'carrot', 'cut into chunks', false, NULL),
  (rid, 6, NULL, 1, 'large', 'onion', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the meat', 'Heat oil. Season beef and brown on all sides. Remove and set aside.', 600, 'Brown meat', NULL),
  (rid, 2, 'Build the base', 'Fry onions until soft. Add tomato paste and cook 3 minutes. Add garlic and ginger.', 300, 'Fry base', NULL),
  (rid, 3, 'Add peanut butter', 'Dissolve peanut butter in 3 cups warm water. Pour into pot with browned meat. Simmer.', NULL, NULL, 'Dissolve fully to avoid lumps.'),
  (rid, 4, 'Add vegetables', 'Add sweet potatoes, carrots. Simmer until tender and sauce is thick, 35-40 minutes.', 2400, 'Simmer stew', NULL),
  (rid, 5, 'Serve', 'Ladle over fluffy white rice.', NULL, NULL, NULL);
END $$;

-- =============================================
-- MALI (ML)
-- =============================================

-- 10. Tigadegena (Mali)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'tigadegena-ml', 'Tigadegena', 'Tigadèguèna', 'Mali''s celebrated peanut sauce stew with tender meat, rich and creamy from slow-cooked onions and tomatoes blended with groundnut paste.',
    'ML', 'Mali', 'West Africa', 'Bambara', 'stew',
    ARRAY['peanut','stew','national-dish','mali'],
    ARRAY['gluten-free','dairy-free','halal'],
    20, 55, 'medium', 6,
    'Tigadegena means "peanut butter sauce" in Bambara and is considered Mali''s national dish. It reflects the central role of groundnuts in Sahelian cuisine.',
    'Daily meals and family gatherings', 'White rice or toh (millet paste)',
    510, 28, 24, 34, 5,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'lamb shoulder', 'cut into pieces', false, 'beef or chicken'),
  (rid, 2, NULL, 0.75, 'cup', 'peanut paste', NULL, false, 'natural peanut butter'),
  (rid, 3, NULL, 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 4, NULL, 2, 'large', 'onions', 'finely chopped', false, NULL),
  (rid, 5, NULL, 2, 'medium', 'potatoes', 'peeled and halved', false, NULL),
  (rid, 6, NULL, 1, 'medium', 'eggplant', 'cubed', false, NULL),
  (rid, 7, NULL, 2, 'whole', 'okra', 'trimmed', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the lamb', 'Season lamb with salt. Heat oil and brown on all sides. Remove and reserve.', 480, 'Brown meat', NULL),
  (rid, 2, 'Fry the aromatics', 'Add onions and fry until softened. Stir in tomato paste and cook 3 minutes.', 300, 'Fry onions', NULL),
  (rid, 3, 'Create peanut sauce', 'Dissolve peanut paste in 3 cups warm water. Pour into pot with browned lamb. Simmer.', NULL, NULL, NULL),
  (rid, 4, 'Cook the stew', 'Add potatoes and eggplant. Cover and simmer 40 minutes until meat is fork-tender and sauce thickened.', 2400, 'Simmer stew', NULL),
  (rid, 5, 'Serve', 'Serve over white rice or alongside toh.', NULL, NULL, NULL);
END $$;

-- 11. Toh (Mali)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'toh-ml', 'Toh', 'Tô', 'A firm, smooth millet porridge shaped into a mound and served as the base for sauces and stews. Mali''s most fundamental staple.',
    'ML', 'Mali', 'West Africa', 'Bambara', 'side',
    ARRAY['millet','staple','porridge','mali'],
    ARRAY['vegan','gluten-free','dairy-free'],
    5, 20, 'easy', 6,
    'Toh is the daily bread of Mali. Made from millet or sorghum flour, it is the foundation upon which most Malian meals are built.',
    'Daily staple', 'Tigadegena, okra sauce, or any stew',
    280, 6, 58, 2, 4,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'millet flour', NULL, false, 'sorghum flour'),
  (rid, 2, NULL, 4, 'cups', 'water', NULL, false, NULL),
  (rid, 3, NULL, 0.5, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make a slurry', 'Mix half the millet flour with 1 cup cold water to form a smooth paste.', NULL, NULL, 'Cold-water slurry prevents lumps.'),
  (rid, 2, 'Boil the water', 'Bring remaining 3 cups water to a rolling boil with salt.', NULL, NULL, NULL),
  (rid, 3, 'Add the slurry', 'Pour slurry into boiling water, stirring constantly. Cook 5 minutes on medium heat.', 300, 'Cook first stage', NULL),
  (rid, 4, 'Add remaining flour', 'Gradually add remaining flour, stirring vigorously. Mixture will become very thick.', 600, 'Stir toh', 'Use a strong wooden spoon.'),
  (rid, 5, 'Shape and serve', 'When toh pulls from pot sides, wet a bowl, scoop in, smooth top, turn out as a mound.', NULL, NULL, 'Serve immediately — toh hardens as it cools.');
END $$;

-- 12. Fakoye (Mali)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'fakoye-ml', 'Fakoye', 'Fakoye', 'A tangy okra and greens soup with dried fish and dawadawa (fermented locust beans). Deeply rooted in Malian tradition.',
    'ML', 'Mali', 'West Africa', 'Songhai', 'soup',
    ARRAY['okra','greens','fermented','mali'],
    ARRAY['gluten-free','dairy-free','pescatarian'],
    15, 30, 'easy', 6,
    'Fakoye is a beloved everyday soup of the Songhai people along the Niger River. The dawadawa gives it distinctive umami depth, while okra provides natural body.',
    'Everyday meals', 'Toh or rice',
    180, 14, 12, 8, 5,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 300, 'g', 'fresh okra', 'sliced', false, NULL),
  (rid, 2, NULL, 200, 'g', 'dried fish', 'soaked and flaked', false, NULL),
  (rid, 3, NULL, 2, 'tbsp', 'dawadawa (soumbala)', 'crumbled', false, NULL),
  (rid, 4, NULL, 2, 'cups', 'leafy greens', 'chopped amaranth or spinach', false, NULL),
  (rid, 5, NULL, 1, 'large', 'onion', 'chopped', false, NULL),
  (rid, 6, NULL, 2, 'tbsp', 'palm oil', NULL, false, 'vegetable oil');

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the base', 'Heat palm oil. Fry onions until softened. Add crumbled dawadawa and stir 1 minute.', 180, 'Fry base', NULL),
  (rid, 2, 'Add liquid and fish', 'Add 4 cups water and dried fish. Boil and simmer 10 minutes.', 600, 'Simmer broth', NULL),
  (rid, 3, 'Add okra', 'Add sliced okra, cook 10 minutes until silky.', 600, 'Cook okra', NULL),
  (rid, 4, 'Add greens and finish', 'Stir in greens, cook 3-5 minutes. Adjust salt and serve hot.', 300, 'Cook greens', NULL);
END $$;

-- =============================================
-- IVORY COAST (CI)
-- =============================================

-- 13. Attiéké with Grilled Fish (Ivory Coast)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'attieke-poisson-ci', 'Attiéké with Grilled Fish', 'Attiéké Poisson', 'Fermented cassava couscous served alongside perfectly grilled fish, tomatoes, and onions. Ivory Coast''s beloved street food lunch.',
    'CI', 'Ivory Coast', 'West Africa', 'Ébrié', 'main',
    ARRAY['cassava','fish','grilled','street-food','ivory-coast'],
    ARRAY['gluten-free','dairy-free','pescatarian'],
    20, 30, 'medium', 4,
    'Attiéké is the pride of the Ébrié lagoon people of southern Ivory Coast. The fermented cassava couscous has a tangy flavour and fluffy texture unlike anything else in West African cuisine. It has become the national lunch dish.',
    'Everyday lunch', 'Sliced onions, tomatoes, and piment',
    420, 32, 48, 12, 5,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'attiéké (cassava couscous)', NULL, false, NULL),
  (rid, 2, NULL, 2, 'whole', 'whole tilapia or sea bream', 'cleaned and scored', false, NULL),
  (rid, 3, NULL, 3, 'medium', 'tomatoes', 'sliced', false, NULL),
  (rid, 4, NULL, 2, 'medium', 'onions', 'sliced into rings', false, NULL),
  (rid, 5, NULL, 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 6, NULL, 2, 'whole', 'scotch bonnet peppers', 'for piment sauce', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Season the fish', 'Rub fish inside and out with salt, pepper, garlic, and a squeeze of lime. Let marinate 15 minutes.', 900, 'Marinate fish', NULL),
  (rid, 2, 'Grill the fish', 'Grill fish over charcoal or on a hot grill pan, turning once, until skin is crispy and flesh is cooked through, about 12 minutes per side.', 1440, 'Grill fish', 'Score the fish deeply so heat penetrates evenly.'),
  (rid, 3, 'Steam the attiéké', 'Steam the attiéké in a steamer basket or microwave for 5 minutes until fluffy and warm. Fluff with a fork and drizzle with a little oil.', 300, 'Steam attiéké', NULL),
  (rid, 4, 'Prepare the garnish', 'Slice tomatoes and onions into rings. Make a simple piment sauce by blending scotch bonnets with a little oil and salt.', NULL, NULL, NULL),
  (rid, 5, 'Serve', 'Place attiéké on a plate, lay the grilled fish alongside, and garnish with tomato and onion slices. Serve piment sauce on the side.', NULL, NULL, NULL);
END $$;

-- 14. Kedjenou (Ivory Coast)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kedjenou-ci', 'Kedjenou', 'Kédjenou', 'A slow-cooked chicken stew made without any added water — the chicken and vegetables steam in their own juices with aromatic herbs and spices.',
    'CI', 'Ivory Coast', 'West Africa', 'Baoulé', 'stew',
    ARRAY['chicken','slow-cooked','no-water','ivory-coast'],
    ARRAY['gluten-free','dairy-free','halal'],
    20, 60, 'medium', 6,
    'Kedjenou is the signature dish of the Baoulé people. Traditionally cooked in a sealed canari (clay pot) over low heat, the chicken releases its own juices creating an intensely flavoured broth without adding any water.',
    'Family meals and gatherings', 'Attiéké or white rice',
    380, 35, 10, 20, 4,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1.5, 'kg', 'chicken pieces', 'bone-in', false, 'guinea fowl'),
  (rid, 2, NULL, 4, 'medium', 'tomatoes', 'quartered', false, NULL),
  (rid, 3, NULL, 2, 'medium', 'onions', 'quartered', false, NULL),
  (rid, 4, NULL, 1, 'medium', 'eggplant', 'cubed', false, NULL),
  (rid, 5, NULL, 3, 'cloves', 'garlic', 'crushed', false, NULL),
  (rid, 6, NULL, 1, 'thumb', 'fresh ginger', 'sliced', false, NULL),
  (rid, 7, NULL, 2, 'whole', 'bay leaves', NULL, false, NULL),
  (rid, 8, NULL, 1, 'whole', 'scotch bonnet pepper', 'whole', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Layer the pot', 'Place chicken in a heavy pot or Dutch oven. Add tomatoes, onions, eggplant, garlic, ginger, bay leaves, and whole scotch bonnet. Season with salt and pepper.', NULL, NULL, 'Do not add any water — this is the key to kedjenou.'),
  (rid, 2, 'Seal and cook', 'Cover the pot tightly with foil and then the lid to create a perfect seal. Cook on the lowest heat possible for 45 minutes.', 2700, 'Slow cook', 'Do not open the lid during cooking — shake the pot occasionally instead.'),
  (rid, 3, 'Check doneness', 'After 45 minutes, carefully open the lid. The chicken should be falling off the bone in a rich, concentrated broth of its own juices.', NULL, NULL, NULL),
  (rid, 4, 'Simmer if needed', 'If the chicken needs more time, reseal and cook another 15 minutes. The sauce should be thick and deeply flavoured.', 900, 'Extra simmer', NULL),
  (rid, 5, 'Serve', 'Serve hot with attiéké or fluffy white rice. The concentrated sauce is incredibly flavourful.', NULL, NULL, NULL);
END $$;

-- 15. Alloco (Ivory Coast)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'alloco-ci', 'Alloco', 'Alloco', 'Deep-fried ripe plantain slices served with a spicy onion and chilli sauce. The most popular street food snack across Ivory Coast.',
    'CI', 'Ivory Coast', 'West Africa', 'Dioula', 'snack',
    ARRAY['plantain','fried','street-food','ivory-coast'],
    ARRAY['vegan','gluten-free','dairy-free'],
    10, 15, 'easy', 4,
    'Alloco vendors line the streets of Abidjan from late afternoon. The sweet, caramelised plantain paired with a fiery onion-tomato-chilli sauce is an irresistible combination that fuels the city.',
    'Afternoon and evening snack', 'Grilled fish or boiled eggs',
    350, 3, 55, 14, 4,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 4, 'whole', 'very ripe plantains', 'sliced diagonally 1cm thick', false, NULL),
  (rid, 2, NULL, 2, 'cups', 'vegetable oil', 'for deep frying', false, NULL),
  (rid, 3, 'Sauce', 2, 'medium', 'onions', 'thinly sliced', false, NULL),
  (rid, 4, 'Sauce', 2, 'medium', 'tomatoes', 'diced', false, NULL),
  (rid, 5, 'Sauce', 2, 'whole', 'scotch bonnet peppers', 'finely chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Heat the oil', 'Heat oil in a deep pan to 180C. The oil should shimmer but not smoke.', NULL, NULL, NULL),
  (rid, 2, 'Fry the plantain', 'Fry plantain slices in batches until deep golden brown on both sides, about 3-4 minutes per batch.', 240, 'Fry plantain', 'Use very ripe plantains — the skin should be mostly black.'),
  (rid, 3, 'Make the sauce', 'In a separate pan, sauté sliced onions until softened. Add diced tomatoes and chopped scotch bonnet. Cook 5 minutes until saucy.', 300, 'Cook sauce', NULL),
  (rid, 4, 'Serve', 'Pile fried plantain on a plate and spoon the spicy onion-tomato sauce over the top. Serve immediately.', NULL, NULL, NULL);
END $$;

-- =============================================
-- BURKINA FASO (BF)
-- =============================================

-- 16. Riz Gras (Burkina Faso)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'riz-gras-bf', 'Riz Gras', 'Riz Gras', 'Burkina Faso''s rich one-pot rice cooked in a meat and tomato broth with vegetables. The rice is "fat" from absorbing all the flavours of the stock.',
    'BF', 'Burkina Faso', 'West Africa', 'Mossi', 'main',
    ARRAY['rice','one-pot','tomato','meat','burkina-faso'],
    ARRAY['gluten-free','dairy-free','halal'],
    20, 50, 'medium', 6,
    'Riz Gras, meaning "fat rice," is the celebratory dish of Burkina Faso. The Mossi people prepare it for weddings, baptisms, and any occasion worthy of gathering. The rice cooks directly in the meat broth, absorbing every drop of flavour.',
    'Celebrations and family gatherings', 'Fried plantain and a simple salad',
    490, 22, 60, 18, 4,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 3, 'cups', 'long-grain rice', 'washed', false, NULL),
  (rid, 2, NULL, 500, 'g', 'beef or goat', 'cut into pieces', false, NULL),
  (rid, 3, NULL, 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 4, NULL, 2, 'large', 'onions', 'chopped', false, NULL),
  (rid, 5, NULL, 2, 'medium', 'carrots', 'diced', false, NULL),
  (rid, 6, NULL, 1, 'small', 'cabbage', 'shredded', false, NULL),
  (rid, 7, NULL, 0.25, 'cup', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the meat', 'Heat oil in a large pot. Season meat and brown on all sides. Remove and reserve.', 600, 'Brown meat', NULL),
  (rid, 2, 'Build the base', 'Fry onions in the same pot until golden. Add tomato paste and cook 3 minutes. Add 5 cups water and the browned meat. Bring to a boil and simmer until meat is tender, about 25 minutes.', 1500, 'Simmer meat', NULL),
  (rid, 3, 'Add vegetables', 'Add carrots and cabbage to the pot. Cook for 5 minutes.', 300, 'Cook vegetables', NULL),
  (rid, 4, 'Cook the rice', 'Add the washed rice to the pot, ensuring liquid covers it by about 2cm. Cover tightly and cook on low heat for 25 minutes without opening.', 1500, 'Cook rice', 'The rice should absorb all the flavoured broth.'),
  (rid, 5, 'Serve', 'Fluff rice with a fork. Serve with the meat and vegetables arranged on top.', NULL, NULL, NULL);
END $$;

-- 17. Babenda (Burkina Faso)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'babenda-bf', 'Babenda', 'Babenda', 'A nourishing porridge of millet flour and leafy greens simmered with dawadawa for umami depth. A staple of everyday Burkinabé cooking.',
    'BF', 'Burkina Faso', 'West Africa', 'Mossi', 'main',
    ARRAY['millet','greens','porridge','burkina-faso'],
    ARRAY['vegan','gluten-free','dairy-free'],
    15, 35, 'easy', 6,
    'Babenda is the soul food of Burkina Faso, eaten daily by millions. It celebrates the Sahelian pantry of millet, leafy greens, and fermented seasonings. Every family has their own version passed down through generations.',
    'Daily meals', 'Toh or boiled yam',
    220, 8, 40, 4, 6,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1.5, 'cups', 'millet flour', NULL, false, 'sorghum flour'),
  (rid, 2, NULL, 4, 'cups', 'leafy greens', 'chopped (sorrel, spinach, or baobab leaves)', false, NULL),
  (rid, 3, NULL, 2, 'tbsp', 'dawadawa (soumbala)', 'crumbled', false, NULL),
  (rid, 4, NULL, 1, 'large', 'onion', 'chopped', false, NULL),
  (rid, 5, NULL, 2, 'tbsp', 'shea butter or vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the greens', 'Wash and chop the leafy greens. Boil in salted water for 10 minutes until tender. Drain, reserving the cooking liquid.', 600, 'Boil greens', NULL),
  (rid, 2, 'Make millet paste', 'Mix millet flour with 1 cup cold water to form a smooth paste.', NULL, NULL, NULL),
  (rid, 3, 'Cook the base', 'In a pot, heat shea butter and fry onion until soft. Add dawadawa and stir. Add 3 cups of the reserved greens liquid and bring to a boil.', 300, 'Cook base', NULL),
  (rid, 4, 'Combine and cook', 'Pour in the millet paste, stirring constantly. Add the cooked greens and stir well. Cook on low heat for 15-20 minutes, stirring frequently, until thick and porridge-like.', 1200, 'Cook babenda', NULL),
  (rid, 5, 'Serve', 'Serve hot in bowls. Babenda should have the consistency of a thick, hearty porridge.', NULL, NULL, NULL);
END $$;

-- 18. Poulet Bicyclette (Burkina Faso)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'poulet-bicyclette-bf', 'Poulet Bicyclette', 'Poulet Bicyclette', 'Grilled free-range chicken marinated in a spicy mustard-lemon mix. Named after the free-range chickens that roam like bicycles through Burkinabé villages.',
    'BF', 'Burkina Faso', 'West Africa', 'Mossi', 'main',
    ARRAY['chicken','grilled','free-range','burkina-faso'],
    ARRAY['gluten-free','dairy-free','halal'],
    30, 40, 'medium', 4,
    'Poulet Bicyclette gets its name from the lean, free-range chickens that roam Burkinabé villages and towns on foot. Their meat is firmer and more flavourful than factory-farmed birds. Grilled over charcoal, it is the king of Ouagadougou''s maquis (open-air bars).',
    'Evening gatherings at maquis', 'Attiéké, fries, or riz gras',
    360, 40, 5, 18, 2,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'whole', 'free-range chicken', 'spatchcocked or halved', false, NULL),
  (rid, 2, NULL, 3, 'tbsp', 'Dijon mustard', NULL, false, NULL),
  (rid, 3, NULL, 3, 'whole', 'limes', 'juiced', false, NULL),
  (rid, 4, NULL, 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, NULL, 1, 'tsp', 'cayenne pepper', NULL, false, NULL),
  (rid, 6, NULL, 2, 'tbsp', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the marinade', 'Mix mustard, lime juice, garlic, cayenne, oil, salt, and pepper into a paste.', NULL, NULL, NULL),
  (rid, 2, 'Marinate the chicken', 'Rub the marinade all over the chicken, getting under the skin. Refrigerate for at least 2 hours, ideally overnight.', 7200, 'Marinate', 'Getting marinade under the skin is key to flavour.'),
  (rid, 3, 'Grill the chicken', 'Grill over medium charcoal heat, turning regularly, for about 35-40 minutes until the skin is crispy and the juices run clear.', 2400, 'Grill chicken', 'Keep the heat medium to cook through without burning.'),
  (rid, 4, 'Rest and serve', 'Let the chicken rest for 5 minutes before cutting into pieces. Serve with your choice of sides.', 300, 'Rest', NULL);
END $$;

-- =============================================
-- NIGER (NE)
-- =============================================

-- 19. Dambou (Niger)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'dambou-ne', 'Dambou', 'Dambou', 'Steamed moringa leaf couscous — tiny granules of millet flour mixed with dried moringa powder, steamed until fluffy and served with a spicy sauce.',
    'NE', 'Niger', 'West Africa', 'Hausa', 'main',
    ARRAY['moringa','millet','steamed','niger'],
    ARRAY['vegan','gluten-free','dairy-free'],
    25, 30, 'medium', 6,
    'Dambou is a nutritional powerhouse from Niger, combining protein-rich moringa leaves with millet flour. Moringa, called "the miracle tree," grows abundantly in the Sahel and is central to Nigerien cuisine and health.',
    'Everyday meals', 'Spicy pepper sauce or stew',
    300, 10, 52, 6, 8,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'millet flour', 'fine', false, NULL),
  (rid, 2, NULL, 1, 'cup', 'dried moringa leaf powder', NULL, false, 'fresh moringa leaves, finely chopped'),
  (rid, 3, NULL, 0.5, 'cup', 'water', 'for mixing', false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'groundnut oil', NULL, false, NULL),
  (rid, 5, NULL, 1, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Mix the dambou', 'In a large bowl, combine millet flour and moringa powder. Sprinkle water gradually while mixing with your fingers to form tiny couscous-like granules.', NULL, NULL, 'The granules should be small and uniform — not clumpy.'),
  (rid, 2, 'First steaming', 'Place the granules in a steamer basket lined with cheesecloth. Steam over boiling water for 15 minutes.', 900, 'First steam', NULL),
  (rid, 3, 'Break and re-steam', 'Remove and break up any clumps with a fork. Drizzle with a little oil and toss. Return to the steamer for another 10 minutes.', 600, 'Second steam', 'Breaking up clumps between steamings gives a fluffy result.'),
  (rid, 4, 'Season and serve', 'Fluff the finished dambou with a fork. Season with salt and a drizzle of groundnut oil. Serve with a spicy tomato-onion sauce.', NULL, NULL, NULL);
END $$;

-- 20. Kilishi (Niger)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kilishi-ne', 'Kilishi', 'Kilishi', 'Paper-thin dried beef jerky coated in a spicy groundnut and chilli paste, then sun-dried until crispy. Niger''s premium dried meat snack.',
    'NE', 'Niger', 'West Africa', 'Hausa', 'snack',
    ARRAY['beef','dried','jerky','spicy','niger'],
    ARRAY['gluten-free','dairy-free','halal'],
    60, 20, 'hard', 8,
    'Kilishi is the gourmet beef jerky of the Sahel, perfected by the Hausa people. The process of slicing beef paper-thin, coating it in a spiced groundnut paste, and drying it in the sun requires great skill. It is a prized gift and travel food.',
    'Snack and gift', 'On its own as a snack',
    280, 35, 6, 14, 2,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'kg', 'beef topside', 'sliced paper-thin', false, NULL),
  (rid, 2, 'Labu paste', 0.5, 'cup', 'roasted groundnut paste', NULL, false, NULL),
  (rid, 3, 'Labu paste', 2, 'tbsp', 'cayenne pepper', NULL, false, NULL),
  (rid, 4, 'Labu paste', 1, 'tsp', 'ground ginger', NULL, false, NULL),
  (rid, 5, 'Labu paste', 1, 'tsp', 'onion powder', NULL, false, NULL),
  (rid, 6, 'Labu paste', 2, 'cubes', 'seasoning cubes', 'crushed', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Slice the beef', 'Using a very sharp knife, slice the beef into paper-thin sheets, as large as possible. The thinner the better.', NULL, NULL, 'Partially freeze the beef for 30 minutes to make slicing easier.'),
  (rid, 2, 'First drying', 'Lay the beef slices on wire racks in the sun or in an oven set to 70C. Dry until firm but still pliable, about 3-4 hours in sun or 2 hours in oven.', 7200, 'Dry beef', NULL),
  (rid, 3, 'Make the labu paste', 'Combine groundnut paste, cayenne, ginger, onion powder, seasoning cubes, and enough water to make a smooth, spreadable paste.', NULL, NULL, 'The paste should be thick enough to coat the meat without dripping.'),
  (rid, 4, 'Coat and re-dry', 'Coat each dried beef slice generously with the labu paste on both sides. Return to the racks and dry again for 2-3 hours until crispy.', 7200, 'Dry coated beef', NULL),
  (rid, 5, 'Quick grill', 'Briefly grill each piece over low heat for 1-2 minutes per side to toast the coating. Store in airtight containers.', 120, 'Toast kilishi', 'Kilishi keeps for weeks at room temperature when properly dried.');
END $$;

-- 21. Tuwo Masara (Niger)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'tuwo-masara-ne', 'Tuwo Masara', 'Tuwo Masara', 'A smooth, firm maize pudding served as the starchy base for soups and stews across Niger. Made by stirring maize flour into boiling water until thick.',
    'NE', 'Niger', 'West Africa', 'Hausa', 'side',
    ARRAY['maize','staple','pudding','niger'],
    ARRAY['vegan','gluten-free','dairy-free'],
    5, 20, 'easy', 6,
    'Tuwo Masara is Niger''s answer to the universal West African swallow. Made from locally grown maize, it provides the caloric foundation for the hearty stews and soups of the Sahel region.',
    'Daily staple', 'Miyan kuka (baobab soup) or any stew',
    310, 6, 68, 2, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'fine maize flour', NULL, false, 'cornmeal'),
  (rid, 2, NULL, 4, 'cups', 'water', NULL, false, NULL),
  (rid, 3, NULL, 0.5, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make slurry', 'Mix 1 cup maize flour with 1 cup cold water until smooth.', NULL, NULL, NULL),
  (rid, 2, 'Boil water', 'Bring remaining 3 cups water to a boil with salt.', NULL, NULL, NULL),
  (rid, 3, 'Cook the tuwo', 'Pour slurry into boiling water, stirring vigorously. Cook on medium heat for 5 minutes, stirring constantly.', 300, 'Cook first stage', NULL),
  (rid, 4, 'Thicken', 'Gradually add remaining maize flour, stirring hard. The mixture will become very thick and pull away from the pot. Cook 10 more minutes.', 600, 'Thicken tuwo', 'Consistent stirring prevents lumps.'),
  (rid, 5, 'Shape and serve', 'Wet a bowl, scoop tuwo in, and shape into a smooth mound. Turn out onto a plate and serve with soup.', NULL, NULL, NULL);
END $$;

-- =============================================
-- GUINEA (GN)
-- =============================================

-- 22. Poulet Yassa Guinéen (Guinea)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'poulet-yassa-gn', 'Guinean Chicken Yassa', 'Yassa Poulet Guinéen', 'Guinea''s version of the classic yassa, enriched with extra ginger and hot peppers, giving it a uniquely Guinean kick compared to the Senegalese original.',
    'GN', 'Guinea', 'West Africa', 'Mandinka', 'main',
    ARRAY['chicken','lemon','onion','guinea'],
    ARRAY['gluten-free','dairy-free','halal'],
    30, 55, 'medium', 6,
    'While yassa travelled across West Africa from the Casamance, Guinea''s version has evolved its own identity. Guinean cooks add more ginger and their own varieties of hot pepper, making it distinctly spicier and more aromatic.',
    'Family meals and celebrations', 'White rice',
    430, 36, 18, 22, 3,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1.5, 'kg', 'chicken pieces', 'bone-in', false, NULL),
  (rid, 2, NULL, 6, 'large', 'onions', 'thinly sliced', false, NULL),
  (rid, 3, NULL, 4, 'whole', 'limes', 'juiced', false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'fresh ginger', 'grated', false, NULL),
  (rid, 5, NULL, 3, 'whole', 'piment peppers', 'whole', false, 'scotch bonnet'),
  (rid, 6, NULL, 0.25, 'cup', 'groundnut oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Marinate', 'Combine chicken with lime juice, half the onions, grated ginger, salt, and pepper. Refrigerate 2-4 hours.', 7200, 'Marinate', NULL),
  (rid, 2, 'Brown the chicken', 'Remove chicken from marinade. Heat oil and brown the chicken pieces on all sides. Remove and set aside.', 600, 'Brown chicken', NULL),
  (rid, 3, 'Cook the onions', 'In the same pot, add all onions (fresh and from marinade). Cook on medium heat until very soft and golden, about 20 minutes.', 1200, 'Cook onions', NULL),
  (rid, 4, 'Simmer', 'Return chicken to pot. Add reserved marinade and whole piment peppers. Cover and simmer 25 minutes until chicken is tender.', 1500, 'Simmer', NULL),
  (rid, 5, 'Serve', 'Serve chicken and onion sauce over steamed white rice.', NULL, NULL, NULL);
END $$;

-- 23. Fouti (Guinea)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'fouti-gn', 'Fouti', 'Fouti', 'Pounded fonio grain formed into a smooth, light ball and served with rich sauces. Fonio is an ancient grain native to West Africa, prized for its delicate flavour.',
    'GN', 'Guinea', 'West Africa', 'Fula', 'side',
    ARRAY['fonio','ancient-grain','staple','guinea'],
    ARRAY['vegan','gluten-free','dairy-free'],
    10, 15, 'easy', 6,
    'Fonio is one of the oldest cultivated grains in Africa, grown in the Fouta Djallon highlands of Guinea for thousands of years. The Fula people consider it the finest grain, reserving it for honoured guests.',
    'Honoured guest meals', 'Peanut sauce or leaf sauce',
    260, 5, 55, 1, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'fonio grain', 'washed', false, 'couscous'),
  (rid, 2, NULL, 2.5, 'cups', 'water', NULL, false, NULL),
  (rid, 3, NULL, 1, 'tbsp', 'butter or oil', NULL, false, NULL),
  (rid, 4, NULL, 0.5, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Wash the fonio', 'Rinse fonio in several changes of water until the water runs clear. Drain thoroughly.', NULL, NULL, 'Fonio is tiny — use a fine-mesh sieve.'),
  (rid, 2, 'Cook the fonio', 'Bring water to a boil with salt and butter. Add the fonio, stir once, cover, and reduce heat to low. Cook 5 minutes.', 300, 'Cook fonio', NULL),
  (rid, 3, 'Steam and fluff', 'Remove from heat and let steam covered for 5 minutes. Fluff with a fork — grains should be separate and light.', 300, 'Steam', NULL),
  (rid, 4, 'Shape and serve', 'Pack fonio into a wet bowl and turn out as a neat mound. Serve alongside sauces and stews.', NULL, NULL, NULL);
END $$;

-- 24. Sauce Feuille (Guinea)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'sauce-feuille-gn', 'Sauce Feuille', 'Sauce Feuille', 'A hearty Guinean leaf sauce made with sweet potato leaves, palm oil, smoked fish, and groundnuts. Rich, nutritious, and deeply savory.',
    'GN', 'Guinea', 'West Africa', 'Susu', 'sauce',
    ARRAY['leaf-sauce','palm-oil','smoked-fish','guinea'],
    ARRAY['gluten-free','dairy-free'],
    20, 40, 'medium', 6,
    'Sauce Feuille is the everyday sauce of Guinea, varying from region to region depending on which leaves are in season. Sweet potato leaves are the most common, valued for their mild flavour and nutritional density.',
    'Everyday meals', 'Rice or fouti',
    340, 20, 16, 24, 7,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 4, 'cups', 'sweet potato leaves', 'washed and finely chopped', false, 'spinach or cassava leaves'),
  (rid, 2, NULL, 0.25, 'cup', 'palm oil', NULL, false, NULL),
  (rid, 3, NULL, 200, 'g', 'smoked fish', 'deboned and flaked', false, NULL),
  (rid, 4, NULL, 0.5, 'cup', 'ground peanuts', NULL, false, 'peanut butter'),
  (rid, 5, NULL, 1, 'large', 'onion', 'chopped', false, NULL),
  (rid, 6, NULL, 2, 'whole', 'hot peppers', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the leaves', 'Boil chopped sweet potato leaves in salted water for 10 minutes. Drain and squeeze out excess water.', 600, 'Boil leaves', NULL),
  (rid, 2, 'Prepare the base', 'Heat palm oil. Fry onion until soft. Add the smoked fish and stir for 2 minutes.', 300, 'Fry base', NULL),
  (rid, 3, 'Add peanuts and leaves', 'Dissolve ground peanuts in 1 cup water and add to the pot. Add the cooked leaves and hot peppers. Stir well.', NULL, NULL, NULL),
  (rid, 4, 'Simmer', 'Simmer on low heat for 20 minutes, stirring occasionally, until the sauce thickens and the flavours meld.', 1200, 'Simmer sauce', 'The sauce should be thick enough to coat the leaves.'),
  (rid, 5, 'Serve', 'Serve hot over rice or with fouti.', NULL, NULL, NULL);
END $$;

-- =============================================
-- SIERRA LEONE (SL)
-- =============================================

-- 25. Cassava Leaf Stew (Sierra Leone)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'cassava-leaf-stew-sl', 'Cassava Leaf Stew', 'Plasas', 'Sierra Leone''s national dish — finely pounded cassava leaves simmered with palm oil, fish, and meat until thick and rich. A deeply savoury, earthy stew.',
    'SL', 'Sierra Leone', 'West Africa', 'Mende', 'stew',
    ARRAY['cassava-leaf','palm-oil','national-dish','sierra-leone'],
    ARRAY['gluten-free','dairy-free'],
    30, 60, 'medium', 6,
    'Cassava Leaf Stew is the soul of Sierra Leonean cooking. The laborious process of pounding the tough leaves until smooth is a communal activity, often done by women singing together. The dish is inseparable from Sierra Leonean identity.',
    'Everyday meals and celebrations', 'White rice',
    450, 28, 14, 32, 8,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'cassava leaves', 'finely pounded or blended', false, 'frozen cassava leaves'),
  (rid, 2, NULL, 0.33, 'cup', 'palm oil', NULL, false, NULL),
  (rid, 3, NULL, 300, 'g', 'smoked fish', 'deboned', false, NULL),
  (rid, 4, NULL, 300, 'g', 'beef or chicken', 'cut into pieces', false, NULL),
  (rid, 5, NULL, 1, 'cup', 'ground peanuts', NULL, false, 'peanut butter'),
  (rid, 6, NULL, 2, 'medium', 'onions', 'chopped', false, NULL),
  (rid, 7, NULL, 2, 'whole', 'scotch bonnet peppers', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the leaves', 'If using fresh leaves, pound or blend them until very fine. Boil in water for 20 minutes to soften and remove bitterness. Drain well.', 1200, 'Cook leaves', 'Frozen pre-pounded cassava leaves save significant time.'),
  (rid, 2, 'Cook the meat', 'Season meat with onions, salt, and pepper. Boil until tender, about 20 minutes. Reserve the stock.', 1200, 'Cook meat', NULL),
  (rid, 3, 'Build the stew', 'Heat palm oil in a large pot. Add remaining onions and fry until soft. Add the drained cassava leaves, smoked fish, cooked meat, and ground peanuts.', NULL, NULL, NULL),
  (rid, 4, 'Simmer', 'Add 2 cups of meat stock and scotch bonnets. Simmer on low heat for 30 minutes, stirring frequently, until thick and the oil rises to the surface.', 1800, 'Simmer stew', 'The stew is ready when the palm oil pools on top.'),
  (rid, 5, 'Serve', 'Serve generous portions over fluffy white rice.', NULL, NULL, NULL);
END $$;

-- 26. Groundnut Stew (Sierra Leone)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'groundnut-stew-sl', 'Groundnut Stew', 'Groundnut Soup', 'A thick, creamy peanut stew with chicken simmered in a tomato and onion base. Sierra Leone''s most comforting one-pot meal.',
    'SL', 'Sierra Leone', 'West Africa', 'Temne', 'stew',
    ARRAY['peanut','chicken','comfort-food','sierra-leone'],
    ARRAY['gluten-free','dairy-free'],
    20, 50, 'medium', 6,
    'Groundnut stew is the second most popular dish in Sierra Leone after cassava leaf. The creamy, nutty broth is the ultimate comfort food, especially during the rainy season when warmth and sustenance are needed most.',
    'Everyday meals', 'White rice or fufu',
    530, 34, 20, 36, 5,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'cup', 'smooth peanut butter', NULL, false, NULL),
  (rid, 2, NULL, 1, 'kg', 'chicken pieces', 'bone-in', false, NULL),
  (rid, 3, NULL, 4, 'medium', 'tomatoes', 'blended', false, NULL),
  (rid, 4, NULL, 2, 'large', 'onions', 'chopped', false, NULL),
  (rid, 5, NULL, 2, 'whole', 'scotch bonnet peppers', NULL, false, NULL),
  (rid, 6, NULL, 2, 'tbsp', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the chicken', 'Season chicken and boil until tender, about 25 minutes. Reserve stock.', 1500, 'Cook chicken', NULL),
  (rid, 2, 'Fry the base', 'Heat oil, fry onions until golden. Add blended tomatoes and cook 10 minutes until reduced.', 600, 'Fry base', NULL),
  (rid, 3, 'Add peanut butter', 'Dissolve peanut butter in 2 cups chicken stock. Pour into the tomato base and stir well.', NULL, NULL, NULL),
  (rid, 4, 'Simmer the stew', 'Add chicken pieces and scotch bonnets. Simmer 20 minutes until thick and creamy.', 1200, 'Simmer', NULL),
  (rid, 5, 'Serve', 'Serve over white rice or with fufu.', NULL, NULL, NULL);
END $$;

-- 27. Fried Akara (Sierra Leone)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'akara-sl', 'Akara', 'Akara', 'Crispy deep-fried bean fritters made from black-eyed pea batter seasoned with onions and peppers. A beloved breakfast and snack across Sierra Leone.',
    'SL', 'Sierra Leone', 'West Africa', 'Krio', 'breakfast',
    ARRAY['beans','fritter','fried','street-food','sierra-leone'],
    ARRAY['vegan','gluten-free','dairy-free'],
    30, 15, 'easy', 6,
    'Akara was brought to Sierra Leone by the Krio people, descendants of freed slaves who returned from the Americas and Britain. These golden fritters are a bridge between African and diaspora foodways.',
    'Breakfast and snacks', 'Pap (fermented corn porridge) or bread',
    280, 14, 30, 12, 6,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'black-eyed peas', 'soaked overnight, skins removed', false, NULL),
  (rid, 2, NULL, 1, 'medium', 'onion', 'roughly chopped', false, NULL),
  (rid, 3, NULL, 1, 'whole', 'scotch bonnet pepper', NULL, false, NULL),
  (rid, 4, NULL, 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 5, NULL, 2, 'cups', 'vegetable oil', 'for frying', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Blend the batter', 'Blend soaked, skinned black-eyed peas with onion, scotch bonnet, salt, and just enough water to form a thick, smooth batter.', NULL, NULL, 'The batter should be thick — too thin and the akara won''t hold shape.'),
  (rid, 2, 'Whip the batter', 'Beat the batter vigorously with a wooden spoon for 3-5 minutes until it becomes light and airy.', 300, 'Whip batter', 'Whipping incorporates air for a fluffy texture.'),
  (rid, 3, 'Heat oil', 'Heat oil in a deep pan to 180C.', NULL, NULL, NULL),
  (rid, 4, 'Fry the akara', 'Drop spoonfuls of batter into the hot oil. Fry in batches until golden brown on all sides, about 3-4 minutes per batch.', 240, 'Fry akara', 'Turn once for even browning.'),
  (rid, 5, 'Drain and serve', 'Drain on paper towels. Serve hot with pap or bread.', NULL, NULL, NULL);
END $$;

-- =============================================
-- LIBERIA (LR)
-- =============================================

-- 28. Palm Butter Soup (Liberia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'palm-butter-soup-lr', 'Palm Butter Soup', 'Palm Butter', 'Liberia''s national dish — a rich, thick soup made from palm fruit extract simmered with meat, fish, and crab. The deep orange colour and velvety texture are unmistakable.',
    'LR', 'Liberia', 'West Africa', 'Kpelle', 'soup',
    ARRAY['palm-fruit','seafood','meat','national-dish','liberia'],
    ARRAY['gluten-free','dairy-free'],
    25, 60, 'medium', 6,
    'Palm Butter Soup is the pride of Liberian cuisine. Made from the extract of boiled palm fruits, it is rich in vitamins and has a unique, silky texture. Every Liberian family has their recipe passed down through generations.',
    'Sunday meals and celebrations', 'White rice or fufu',
    580, 30, 12, 48, 5,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'palm fruit concentrate', NULL, false, 'canned palm cream'),
  (rid, 2, NULL, 300, 'g', 'beef or goat', 'cut into pieces', false, NULL),
  (rid, 3, NULL, 200, 'g', 'smoked fish', 'deboned', false, NULL),
  (rid, 4, NULL, 200, 'g', 'crab or crayfish', 'cleaned', true, NULL),
  (rid, 5, NULL, 2, 'medium', 'onions', 'chopped', false, NULL),
  (rid, 6, NULL, 2, 'whole', 'scotch bonnet peppers', NULL, false, NULL),
  (rid, 7, NULL, 4, 'whole', 'okra', 'sliced', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the meat', 'Season meat with onions, salt, and pepper. Boil until tender, about 25 minutes. Reserve stock.', 1500, 'Cook meat', NULL),
  (rid, 2, 'Prepare palm butter base', 'In a large pot, combine palm fruit concentrate with 2 cups of meat stock. Bring to a boil, stirring well.', NULL, NULL, NULL),
  (rid, 3, 'Add proteins', 'Add the cooked meat, smoked fish, and crab to the palm butter. Add scotch bonnets and okra if using.', NULL, NULL, NULL),
  (rid, 4, 'Simmer the soup', 'Simmer on low heat for 30 minutes, stirring occasionally, until the soup thickens and the oil separates on top.', 1800, 'Simmer soup', 'The soup is ready when the palm oil pools on the surface.'),
  (rid, 5, 'Serve', 'Serve hot over white rice or with fufu.', NULL, NULL, NULL);
END $$;

-- 29. Jollof Rice (Liberia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'jollof-rice-lr', 'Liberian Jollof Rice', 'Jollof Rice', 'Liberia''s distinctive jollof rice, often made with a mix of meats and seasoned with Liberian-style spice blends. Rich, tomatoey, and packed with protein.',
    'LR', 'Liberia', 'West Africa', 'Kpelle', 'main',
    ARRAY['rice','one-pot','tomato','liberia'],
    ARRAY['gluten-free','dairy-free','halal'],
    25, 55, 'medium', 6,
    'Liberian Jollof has its own character, often incorporating more meats and a slightly sweeter tomato base. It is the centrepiece of every celebration and gathering.',
    'Celebrations', 'Fried plantain and pepper sauce',
    500, 24, 62, 18, 4,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 3, 'cups', 'long-grain rice', 'washed', false, NULL),
  (rid, 2, NULL, 300, 'g', 'chicken pieces', NULL, false, NULL),
  (rid, 3, NULL, 200, 'g', 'smoked turkey', 'chopped', false, NULL),
  (rid, 4, NULL, 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 5, NULL, 4, 'medium', 'tomatoes', 'blended', false, NULL),
  (rid, 6, NULL, 2, 'large', 'onions', 'chopped', false, NULL),
  (rid, 7, NULL, 0.25, 'cup', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the meats', 'Season chicken and smoked turkey with salt, pepper, and onions. Boil until chicken is tender. Reserve stock.', 1200, 'Cook meats', NULL),
  (rid, 2, 'Fry the base', 'Heat oil, fry onions until golden. Add tomato paste and cook 3 minutes. Add blended tomatoes and cook until reduced.', 900, 'Fry base', NULL),
  (rid, 3, 'Add rice', 'Add rice and stir to coat. Pour in 4 cups meat stock. Add cooked meats. Cover tightly.', NULL, NULL, NULL),
  (rid, 4, 'Cook', 'Cook on low heat for 30-35 minutes until rice is tender and has absorbed the sauce.', 2100, 'Cook rice', NULL),
  (rid, 5, 'Serve', 'Fluff and serve with fried plantain and pepper sauce.', NULL, NULL, NULL);
END $$;

-- 30. Torborgee (Liberia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'torborgee-lr', 'Torborgee', 'Torborgee', 'A fiery Liberian stew of fermented locust beans, dried shrimp, and intense chilli peppers. One of the hottest dishes in West African cuisine.',
    'LR', 'Liberia', 'West Africa', 'Bassa', 'stew',
    ARRAY['fermented','spicy','dried-shrimp','liberia'],
    ARRAY['gluten-free','dairy-free','pescatarian'],
    20, 40, 'medium', 6,
    'Torborgee is the dish that separates the brave from the timid. Made with dawadawa and an abundance of hot peppers, it is an acquired taste that Liberians adore. It is said that once you develop a taste for torborgee, no other stew will satisfy.',
    'Everyday meals', 'White rice or fufu',
    220, 18, 10, 12, 4,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 0.5, 'cup', 'fermented locust beans (dawadawa)', NULL, false, NULL),
  (rid, 2, NULL, 200, 'g', 'dried shrimp', NULL, false, NULL),
  (rid, 3, NULL, 200, 'g', 'dried fish', 'soaked', false, NULL),
  (rid, 4, NULL, 6, 'whole', 'habanero peppers', 'blended', false, NULL),
  (rid, 5, NULL, 2, 'medium', 'onions', 'chopped', false, NULL),
  (rid, 6, NULL, 2, 'tbsp', 'palm oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the base', 'Heat palm oil. Fry onions until softened. Add dawadawa and stir for 2 minutes.', 300, 'Fry base', NULL),
  (rid, 2, 'Add peppers', 'Add the blended habaneros and cook for 5 minutes, stirring frequently.', 300, 'Cook peppers', 'This will be very spicy — adjust peppers to your tolerance.'),
  (rid, 3, 'Add seafood', 'Add dried shrimp and soaked dried fish. Pour in 2 cups water. Bring to a simmer.', NULL, NULL, NULL),
  (rid, 4, 'Simmer', 'Cook on low heat for 25 minutes until the stew is thick and intensely flavoured.', 1500, 'Simmer', NULL),
  (rid, 5, 'Serve', 'Serve over white rice. A small amount goes a long way due to the intensity.', NULL, NULL, NULL);
END $$;

-- =============================================
-- TOGO (TG)
-- =============================================

-- 31. Koklo Meme (Togo)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'koklo-meme-tg', 'Koklo Meme', 'Koklo Meme', 'Togo''s beloved grilled chicken marinated in a paste of ginger, garlic, chilli, and lime. Charred over wood charcoal for an unmistakable smoky flavour.',
    'TG', 'Togo', 'West Africa', 'Ewe', 'main',
    ARRAY['chicken','grilled','spicy','street-food','togo'],
    ARRAY['gluten-free','dairy-free','halal'],
    30, 35, 'medium', 4,
    'Koklo Meme is the king of Togolese street food. The name means "grilled chicken" in Ewe, and the charcoal-grilled birds with their spicy marinade are a fixture of every market and roadside stall in Lomé.',
    'Street food and gatherings', 'Piment sauce, yam fries, or rice',
    380, 38, 6, 20, 2,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'whole', 'chicken', 'spatchcocked', false, NULL),
  (rid, 2, NULL, 2, 'tbsp', 'fresh ginger', 'grated', false, NULL),
  (rid, 3, NULL, 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 4, NULL, 2, 'whole', 'scotch bonnet peppers', 'blended', false, NULL),
  (rid, 5, NULL, 3, 'whole', 'limes', 'juiced', false, NULL),
  (rid, 6, NULL, 2, 'tbsp', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the marinade', 'Blend ginger, garlic, scotch bonnets, lime juice, oil, salt, and pepper into a smooth paste.', NULL, NULL, NULL),
  (rid, 2, 'Marinate the chicken', 'Rub marinade all over the chicken, under the skin and into every crevice. Refrigerate at least 2 hours.', 7200, 'Marinate', 'Overnight gives the most flavour.'),
  (rid, 3, 'Grill the chicken', 'Grill over medium charcoal heat, turning regularly, for 30-35 minutes until skin is crispy and charred and juices run clear.', 2100, 'Grill', 'Baste with remaining marinade while grilling.'),
  (rid, 4, 'Rest and serve', 'Rest for 5 minutes, then cut into pieces. Serve with piment sauce and sides.', 300, 'Rest', NULL);
END $$;

-- 32. Fufu with Gboma Dessi (Togo)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'fufu-gboma-dessi-tg', 'Fufu with Gboma Dessi', 'Fufu kple Gboma Dessi', 'Smooth pounded yam fufu served with gboma dessi — a rich spinach and tomato stew with smoked fish and crab. A classic Ewe combination.',
    'TG', 'Togo', 'West Africa', 'Ewe', 'main',
    ARRAY['fufu','spinach','stew','togo'],
    ARRAY['gluten-free','dairy-free'],
    30, 45, 'medium', 6,
    'Gboma Dessi is the quintessential Ewe stew, made with gboma (a local variety of spinach) and enriched with smoked fish and crab. Paired with smooth pounded yam fufu, it is the ultimate comfort meal in Togo.',
    'Everyday meals', 'Fufu (included in recipe)',
    480, 26, 52, 20, 7,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Fufu', 500, 'g', 'yam', 'peeled and cubed', false, 'instant pounded yam flour'),
  (rid, 2, 'Stew', 4, 'cups', 'spinach or amaranth greens', 'finely chopped', false, NULL),
  (rid, 3, 'Stew', 4, 'medium', 'tomatoes', 'blended', false, NULL),
  (rid, 4, 'Stew', 200, 'g', 'smoked fish', 'deboned', false, NULL),
  (rid, 5, 'Stew', 0.25, 'cup', 'palm oil', NULL, false, NULL),
  (rid, 6, 'Stew', 2, 'medium', 'onions', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the fufu', 'Boil yam pieces until very soft, about 20 minutes. Pound in a mortar or mash until completely smooth with no lumps.', 1200, 'Cook yam', 'Alternatively, use instant pounded yam flour.'),
  (rid, 2, 'Prepare the stew base', 'Heat palm oil. Fry onions until soft. Add blended tomatoes and cook until reduced and oil separates, about 15 minutes.', 900, 'Cook base', NULL),
  (rid, 3, 'Add fish and greens', 'Add smoked fish and stir. Add the chopped greens and cook for 10 minutes until wilted and integrated into the sauce.', 600, 'Cook stew', NULL),
  (rid, 4, 'Season and simmer', 'Season with salt and pepper. Simmer 5 more minutes until thick. The stew should coat a spoon.', 300, 'Simmer', NULL),
  (rid, 5, 'Serve', 'Shape fufu into smooth balls and serve in a bowl alongside the gboma dessi.', NULL, NULL, NULL);
END $$;

-- 33. Akoumé (Togo)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'akoume-tg', 'Akoumé', 'Akoumé', 'A firm corn flour dough similar to polenta, steamed until solid and served as the starchy base for Togolese soups and stews.',
    'TG', 'Togo', 'West Africa', 'Mina', 'side',
    ARRAY['corn','staple','dough','togo'],
    ARRAY['vegan','gluten-free','dairy-free'],
    5, 20, 'easy', 6,
    'Akoumé is Togo''s everyday staple, the equivalent of fufu but made from corn flour. Its neutral flavour makes it the perfect vehicle for the bold, spicy stews and sauces of Togolese cuisine.',
    'Daily staple', 'Any soup or stew',
    290, 5, 62, 2, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'fine corn flour', NULL, false, 'cornmeal'),
  (rid, 2, NULL, 4, 'cups', 'water', NULL, false, NULL),
  (rid, 3, NULL, 0.5, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make slurry', 'Mix 1 cup corn flour with 1 cup cold water to a smooth paste.', NULL, NULL, NULL),
  (rid, 2, 'Cook', 'Bring 3 cups water to boil with salt. Pour in slurry, stirring constantly. Cook 5 minutes.', 300, 'Cook base', NULL),
  (rid, 3, 'Thicken', 'Add remaining flour gradually, stirring vigorously until very thick and smooth. Cook 10 more minutes.', 600, 'Thicken', NULL),
  (rid, 4, 'Shape and serve', 'Wet a bowl, scoop akoumé in, smooth top, turn out as a mound. Serve with stew.', NULL, NULL, NULL);
END $$;

-- =============================================
-- BENIN (BJ)
-- =============================================

-- 34. Kuli-Kuli (Benin)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kuli-kuli-bj', 'Kuli-Kuli', 'Kuli-Kuli', 'Crunchy groundnut crackers made by extracting the oil from peanut paste, then shaping and deep-frying the remaining cake. A beloved protein-rich snack.',
    'BJ', 'Benin', 'West Africa', 'Fon', 'snack',
    ARRAY['peanut','fried','protein','snack','benin'],
    ARRAY['vegan','gluten-free','dairy-free'],
    30, 15, 'medium', 8,
    'Kuli-Kuli are the crunch of Beninese markets. Vendors shape the groundnut paste into sticks, rings, or balls before frying. They are eaten as snacks, crumbled into salads, or ground back into powder for soups.',
    'Snack', 'On its own or crumbled over salads',
    320, 16, 10, 26, 4,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 3, 'cups', 'roasted peanuts', 'skins removed', false, NULL),
  (rid, 2, NULL, 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 3, NULL, 0.5, 'tsp', 'cayenne pepper', NULL, true, NULL),
  (rid, 4, NULL, 2, 'cups', 'vegetable oil', 'for frying', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Grind the peanuts', 'Blend roasted peanuts in a food processor until they form a thick paste, similar to peanut butter.', NULL, NULL, NULL),
  (rid, 2, 'Extract the oil', 'Knead the paste vigorously, squeezing out as much oil as possible. The paste should become crumbly and dry. Reserve the extracted oil.', NULL, NULL, 'This step is crucial — the drier the paste, the crunchier the kuli-kuli.'),
  (rid, 3, 'Season and shape', 'Mix salt and cayenne into the paste. Shape into small sticks, rings, or flat rounds about 1cm thick.', NULL, NULL, NULL),
  (rid, 4, 'Fry', 'Heat oil to 170C. Fry in batches until deep golden brown and very crunchy, about 4-5 minutes per batch.', 300, 'Fry kuli-kuli', 'Keep the heat moderate to fry through without burning.'),
  (rid, 5, 'Drain and cool', 'Drain on paper towels. Let cool completely — they crisp up more as they cool. Store in an airtight container.', NULL, NULL, NULL);
END $$;

-- 35. Amiwo (Benin)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'amiwo-bj', 'Amiwo', 'Amiwo', 'A savoury red corn porridge cooked in a rich tomato and crab sauce. The cornmeal absorbs the tomato colour and flavour, turning a beautiful red-orange.',
    'BJ', 'Benin', 'West Africa', 'Fon', 'main',
    ARRAY['corn','tomato','crab','porridge','benin'],
    ARRAY['gluten-free','dairy-free'],
    20, 40, 'medium', 6,
    'Amiwo is a celebratory dish from southern Benin, always present at ceremonies and important gatherings. The red colour from the tomato sauce symbolises joy and festivity in Fon culture.',
    'Celebrations and ceremonies', 'Fried chicken or grilled fish',
    380, 14, 52, 14, 4,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'fine cornmeal', NULL, false, NULL),
  (rid, 2, NULL, 4, 'medium', 'tomatoes', 'blended', false, NULL),
  (rid, 3, NULL, 2, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 4, NULL, 200, 'g', 'crab meat', 'cleaned', false, 'crayfish'),
  (rid, 5, NULL, 1, 'large', 'onion', 'chopped', false, NULL),
  (rid, 6, NULL, 0.25, 'cup', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the tomato sauce', 'Heat oil, fry onion until soft. Add tomato paste and cook 3 minutes. Add blended tomatoes and cook until reduced and thick, about 15 minutes.', 900, 'Cook sauce', NULL),
  (rid, 2, 'Add crab', 'Add crab meat to the sauce and stir. Cook for 5 minutes.', 300, 'Cook crab', NULL),
  (rid, 3, 'Add cornmeal', 'Add 3 cups water to the sauce. Bring to a boil. Gradually sprinkle in cornmeal while stirring constantly to prevent lumps.', NULL, NULL, NULL),
  (rid, 4, 'Cook the amiwo', 'Reduce heat to low. Stir continuously for 15-20 minutes until the cornmeal is cooked through and pulls away from the pot sides.', 1200, 'Cook amiwo', 'The colour should be a vibrant red-orange.'),
  (rid, 5, 'Serve', 'Shape into a mound on a plate. Serve with fried chicken or grilled fish.', NULL, NULL, NULL);
END $$;

-- 36. Wagasi Grillé (Benin)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'wagasi-grille-bj', 'Grilled Wagasi', 'Wagasi Grillé', 'Beninese soft white cheese grilled until golden and served with a spicy piment sauce. A unique West African cheese snack with a satisfying chewy texture.',
    'BJ', 'Benin', 'West Africa', 'Fula', 'snack',
    ARRAY['cheese','grilled','street-food','benin'],
    ARRAY['gluten-free','vegetarian'],
    10, 10, 'easy', 4,
    'Wagasi is one of the few traditional cheeses in West Africa, made by the Fula (Fulani) herders from fresh cow''s milk. Grilled on roadside stalls across Benin, it is an important source of protein and a beloved snack.',
    'Street snack', 'Piment sauce and sliced onions',
    220, 18, 2, 16, 0,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 400, 'g', 'wagasi (West African soft cheese)', 'cut into 2cm slices', false, 'paneer or halloumi'),
  (rid, 2, NULL, 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 3, 'Sauce', 3, 'whole', 'scotch bonnet peppers', 'blended', false, NULL),
  (rid, 4, 'Sauce', 1, 'medium', 'onion', 'finely chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the cheese', 'Cut wagasi into slices about 2cm thick. Pat dry with paper towels.', NULL, NULL, NULL),
  (rid, 2, 'Grill the cheese', 'Brush with oil and grill on a hot grill pan or barbecue for 3-4 minutes per side until golden brown with grill marks.', 480, 'Grill wagasi', 'Do not move the cheese too early — let it develop a crust.'),
  (rid, 3, 'Make piment sauce', 'Mix blended scotch bonnets with chopped onion, a squeeze of lime, and salt.', NULL, NULL, NULL),
  (rid, 4, 'Serve', 'Serve the grilled wagasi hot with the piment sauce for dipping.', NULL, NULL, NULL);
END $$;

-- =============================================
-- GAMBIA (GM)
-- =============================================

-- 37. Domoda (Gambia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'domoda-gm', 'Domoda', 'Domoda', 'Gambia''s national dish — a creamy groundnut stew with beef, tomatoes, and pumpkin, served over white rice. Rich, nutty, and deeply comforting.',
    'GM', 'Gambia', 'West Africa', 'Mandinka', 'stew',
    ARRAY['peanut','stew','national-dish','gambia'],
    ARRAY['gluten-free','dairy-free','halal'],
    20, 55, 'medium', 6,
    'Domoda is to Gambia what jollof is to Nigeria — the dish that defines the nation''s cuisine. This Mandinka groundnut stew is eaten across all ethnic groups and is the most requested dish at any Gambian gathering.',
    'Everyday meals and celebrations', 'White rice',
    530, 30, 26, 34, 6,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'beef stewing cuts', 'cubed', false, 'chicken or lamb'),
  (rid, 2, NULL, 0.75, 'cup', 'smooth peanut butter', NULL, false, NULL),
  (rid, 3, NULL, 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 4, NULL, 200, 'g', 'pumpkin or butternut squash', 'cubed', false, NULL),
  (rid, 5, NULL, 2, 'large', 'onions', 'chopped', false, NULL),
  (rid, 6, NULL, 1, 'whole', 'scotch bonnet pepper', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the meat', 'Season beef and brown in oil on all sides. Remove and reserve.', 600, 'Brown meat', NULL),
  (rid, 2, 'Cook the base', 'Fry onions until soft. Add tomato paste and cook 3 minutes. Add 3 cups water and the browned meat. Simmer 20 minutes.', 1200, 'Simmer meat', NULL),
  (rid, 3, 'Add peanut butter', 'Dissolve peanut butter in 1 cup warm water. Stir into the pot until smooth. Add pumpkin and scotch bonnet.', NULL, NULL, NULL),
  (rid, 4, 'Simmer the stew', 'Cook on low heat for 25 minutes until pumpkin is tender and sauce is thick and creamy.', 1500, 'Simmer stew', 'Stir regularly to prevent sticking.'),
  (rid, 5, 'Serve', 'Serve generously over white rice.', NULL, NULL, NULL);
END $$;

-- 38. Benachin (Gambia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'benachin-gm', 'Benachin', 'Benachin', 'Gambia''s one-pot rice dish — rice cooked in a rich tomato and vegetable sauce with fish or meat. Benachin means "one pot" in Wolof.',
    'GM', 'Gambia', 'West Africa', 'Wolof', 'main',
    ARRAY['rice','one-pot','tomato','fish','gambia'],
    ARRAY['gluten-free','dairy-free'],
    30, 60, 'medium', 6,
    'Benachin is the Gambian cousin of Senegalese thieboudienne. The name means "one pot" in Wolof, and the dish is a celebration of communal cooking where everything comes together in a single vessel.',
    'Family meals', 'Lime wedges and tapalapa bread',
    480, 28, 58, 16, 5,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 3, 'cups', 'rice', 'washed', false, NULL),
  (rid, 2, NULL, 500, 'g', 'whole fish or fish steaks', 'cleaned', false, 'chicken pieces'),
  (rid, 3, NULL, 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 4, NULL, 1, 'medium', 'sweet potato', 'peeled, halved', false, NULL),
  (rid, 5, NULL, 1, 'medium', 'cassava', 'peeled, quartered', false, NULL),
  (rid, 6, NULL, 2, 'large', 'onions', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Fry the fish', 'Season fish and fry until browned on both sides. Remove and set aside.', 600, 'Fry fish', NULL),
  (rid, 2, 'Build the sauce', 'Fry onions until golden. Add tomato paste and cook 5 minutes. Add 5 cups water and bring to a boil.', 600, 'Cook sauce', NULL),
  (rid, 3, 'Cook vegetables', 'Add sweet potato and cassava. Simmer 15 minutes until partly tender. Remove vegetables.', 900, 'Cook vegetables', NULL),
  (rid, 4, 'Cook the rice', 'Add washed rice to the sauce. Arrange vegetables and fish on top. Cover tightly and cook on low 25-30 minutes.', 1800, 'Cook rice', 'Do not stir — let the rice absorb the sauce undisturbed.'),
  (rid, 5, 'Serve', 'Serve on a large platter with rice, fish, and vegetables arranged together.', NULL, NULL, NULL);
END $$;

-- 39. Supakanja (Gambia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'supakanja-gm', 'Supakanja', 'Supakanja', 'A thick, slimy okra soup enriched with palm oil, dried fish, and seafood. The okra gives it a distinctive silky, mucilaginous texture.',
    'GM', 'Gambia', 'West Africa', 'Jola', 'soup',
    ARRAY['okra','palm-oil','seafood','gambia'],
    ARRAY['gluten-free','dairy-free'],
    20, 40, 'medium', 6,
    'Supakanja is the everyday okra soup of Gambia. The word "kanja" refers to okra, and this soup celebrates the vegetable in its full glory — the silky, slippery texture is considered a virtue, not a flaw.',
    'Everyday meals', 'White rice or fufu',
    280, 20, 14, 16, 5,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 400, 'g', 'fresh okra', 'finely sliced', false, NULL),
  (rid, 2, NULL, 0.25, 'cup', 'palm oil', NULL, false, NULL),
  (rid, 3, NULL, 200, 'g', 'dried fish', 'soaked and flaked', false, NULL),
  (rid, 4, NULL, 200, 'g', 'fresh shrimp', 'peeled', false, NULL),
  (rid, 5, NULL, 1, 'large', 'onion', 'chopped', false, NULL),
  (rid, 6, NULL, 2, 'whole', 'scotch bonnet peppers', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the okra', 'Heat palm oil. Add okra and fry, stirring, for 10 minutes until it becomes slimy and deep green.', 600, 'Fry okra', NULL),
  (rid, 2, 'Add aromatics', 'Add onion, scotch bonnets, and dried fish. Stir well and cook 5 minutes.', 300, 'Cook aromatics', NULL),
  (rid, 3, 'Add liquid and shrimp', 'Add 3 cups water and bring to a simmer. Add fresh shrimp and cook 15 minutes until the soup is thick and rich.', 900, 'Simmer soup', NULL),
  (rid, 4, 'Serve', 'Season with salt and serve over white rice or with fufu.', NULL, NULL, NULL);
END $$;

-- =============================================
-- GUINEA-BISSAU (GW)
-- =============================================

-- 40. Caldo de Mancarra (Guinea-Bissau)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'caldo-de-mancarra-gw', 'Caldo de Mancarra', 'Caldo de Mancarra', 'Guinea-Bissau''s groundnut soup — a thick peanut broth with chicken and vegetables, reflecting both Portuguese and West African culinary traditions.',
    'GW', 'Guinea-Bissau', 'West Africa', 'Balanta', 'soup',
    ARRAY['peanut','chicken','soup','guinea-bissau'],
    ARRAY['gluten-free','dairy-free','halal'],
    20, 50, 'medium', 6,
    'Caldo de Mancarra blends Guinea-Bissau''s African heritage with Portuguese colonial influences. "Mancarra" is the local Creole word for peanut, and this soup is the nation''s most beloved comfort dish.',
    'Everyday meals', 'White rice',
    500, 30, 20, 34, 5,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'kg', 'chicken pieces', 'bone-in', false, NULL),
  (rid, 2, NULL, 1, 'cup', 'roasted peanuts', 'ground to paste', false, 'peanut butter'),
  (rid, 3, NULL, 3, 'medium', 'tomatoes', 'chopped', false, NULL),
  (rid, 4, NULL, 2, 'medium', 'sweet potatoes', 'cubed', false, NULL),
  (rid, 5, NULL, 2, 'large', 'onions', 'chopped', false, NULL),
  (rid, 6, NULL, 1, 'whole', 'hot pepper', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the chicken', 'Season chicken and boil with onions until tender, about 25 minutes. Reserve stock.', 1500, 'Cook chicken', NULL),
  (rid, 2, 'Build the base', 'In the same pot, fry remaining onions. Add tomatoes and cook until softened.', 600, 'Fry base', NULL),
  (rid, 3, 'Add peanut paste', 'Dissolve ground peanuts in 2 cups chicken stock. Add to the pot along with sweet potatoes and hot pepper.', NULL, NULL, NULL),
  (rid, 4, 'Simmer', 'Add chicken back. Simmer 20 minutes until sweet potatoes are tender and soup is thick.', 1200, 'Simmer soup', NULL),
  (rid, 5, 'Serve', 'Serve hot over white rice.', NULL, NULL, NULL);
END $$;

-- 41. Chabéu (Guinea-Bissau)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'chabeu-gw', 'Chabéu', 'Chabéu', 'Jollof-style rice from Guinea-Bissau, cooked in a palm oil and tomato base with dried fish and vegetables. The palm oil gives it a distinctive golden-red hue.',
    'GW', 'Guinea-Bissau', 'West Africa', 'Papel', 'main',
    ARRAY['rice','palm-oil','one-pot','guinea-bissau'],
    ARRAY['gluten-free','dairy-free','pescatarian'],
    20, 50, 'medium', 6,
    'Chabéu is Guinea-Bissau''s take on the West African one-pot rice tradition. The use of palm oil instead of vegetable oil distinguishes it from other jollof variations, giving it a unique colour and nutty flavour.',
    'Family meals', 'Fried fish and salad',
    440, 18, 60, 16, 4,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 3, 'cups', 'rice', 'washed', false, NULL),
  (rid, 2, NULL, 0.25, 'cup', 'palm oil', NULL, false, NULL),
  (rid, 3, NULL, 200, 'g', 'dried fish', 'soaked and flaked', false, NULL),
  (rid, 4, NULL, 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 5, NULL, 2, 'large', 'onions', 'chopped', false, NULL),
  (rid, 6, NULL, 1, 'medium', 'eggplant', 'cubed', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Fry the base', 'Heat palm oil. Fry onions until golden. Add tomato paste and cook 3 minutes.', 300, 'Fry base', NULL),
  (rid, 2, 'Add fish and vegetables', 'Add dried fish, eggplant, and 5 cups water. Bring to a boil and simmer 10 minutes.', 600, 'Simmer base', NULL),
  (rid, 3, 'Add rice', 'Add washed rice. Stir once, cover tightly, and cook on low heat for 25-30 minutes.', 1800, 'Cook rice', 'Do not lift the lid during cooking.'),
  (rid, 4, 'Serve', 'Fluff rice and serve with the fish and vegetables mixed through.', NULL, NULL, NULL);
END $$;

-- 42. Arroz de Caju (Guinea-Bissau)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'arroz-de-caju-gw', 'Cashew Rice', 'Arroz de Caju', 'Fragrant rice cooked with roasted cashew nuts, onions, and aromatic spices. A celebration of Guinea-Bissau''s status as a major cashew producer.',
    'GW', 'Guinea-Bissau', 'West Africa', 'Manjaco', 'side',
    ARRAY['rice','cashew','aromatic','guinea-bissau'],
    ARRAY['vegetarian','dairy-free'],
    15, 30, 'easy', 6,
    'Guinea-Bissau is one of the world''s largest cashew producers, and cashews feature prominently in the cuisine. This rice dish is a simple yet flavourful showcase of the country''s prized nut.',
    'Everyday side dish', 'Grilled chicken or fish stew',
    380, 8, 54, 14, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'long-grain rice', 'washed', false, NULL),
  (rid, 2, NULL, 1, 'cup', 'raw cashew nuts', 'roughly chopped', false, NULL),
  (rid, 3, NULL, 1, 'large', 'onion', 'finely chopped', false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'butter', NULL, false, 'vegetable oil'),
  (rid, 5, NULL, 3, 'cups', 'water or chicken stock', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Toast the cashews', 'Dry-toast cashew nuts in a pan over medium heat until golden and fragrant, about 5 minutes. Set aside.', 300, 'Toast cashews', 'Watch carefully — they can burn quickly.'),
  (rid, 2, 'Cook the rice base', 'Melt butter, fry onion until golden. Add rice and stir to coat. Pour in water or stock, season with salt.', NULL, NULL, NULL),
  (rid, 3, 'Cook', 'Bring to a boil, cover, reduce to low heat. Cook 18-20 minutes until rice is tender and liquid is absorbed.', 1200, 'Cook rice', NULL),
  (rid, 4, 'Finish', 'Fluff rice with a fork, fold in toasted cashews. Serve as a side dish.', NULL, NULL, NULL);
END $$;

-- =============================================
-- MAURITANIA (MR)
-- =============================================

-- 43. Thieboudienne Mauritanien (Mauritania)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'thieboudienne-mr', 'Mauritanian Fish Rice', 'Thieboudienne', 'Mauritania''s version of the classic fish and rice dish, featuring Atlantic fish from the country''s rich coastal waters, cooked in a tomato and vegetable sauce.',
    'MR', 'Mauritania', 'West Africa', 'Wolof', 'main',
    ARRAY['rice','fish','tomato','mauritania'],
    ARRAY['gluten-free','dairy-free','pescatarian'],
    35, 65, 'hard', 8,
    'Mauritania''s Atlantic coast provides some of the richest fishing grounds in West Africa. Their thieboudienne uses the freshest ocean fish, and the dish is shared communally on large platters among family and guests.',
    'Lunch gatherings', 'Lime wedges',
    520, 34, 58, 16, 6,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'kg', 'fresh ocean fish', 'cleaned and scored', false, 'grouper or snapper'),
  (rid, 2, NULL, 3, 'cups', 'rice', 'washed', false, NULL),
  (rid, 3, NULL, 0.33, 'cup', 'tomato paste', NULL, false, NULL),
  (rid, 4, NULL, 2, 'medium', 'carrots', 'halved', false, NULL),
  (rid, 5, NULL, 1, 'medium', 'cabbage', 'quartered', false, NULL),
  (rid, 6, NULL, 2, 'large', 'onions', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the fish', 'Season fish with garlic, parsley, and lemon. Let marinate 15 minutes. Fry until browned. Set aside.', 900, 'Fry fish', NULL),
  (rid, 2, 'Cook the sauce', 'Fry onions. Add tomato paste and cook 5 minutes. Add 6 cups water.', 600, 'Cook sauce', NULL),
  (rid, 3, 'Add vegetables', 'Add carrots and cabbage. Simmer 15 minutes until tender. Remove vegetables and fish.', 900, 'Cook vegetables', NULL),
  (rid, 4, 'Cook the rice', 'Add washed rice to the sauce. Cover tightly and cook on low 25 minutes.', 1500, 'Cook rice', NULL),
  (rid, 5, 'Assemble', 'Mound rice on a platter. Arrange fish and vegetables on top. Serve communally.', NULL, NULL, NULL);
END $$;

-- 44. Mechoui (Mauritania)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'mechoui-mr', 'Mechoui', 'Mechoui', 'Slow-roasted whole lamb seasoned with cumin, coriander, and butter, cooked over embers until the meat falls off the bone. Mauritania''s ultimate celebration dish.',
    'MR', 'Mauritania', 'West Africa', 'Moor', 'main',
    ARRAY['lamb','roasted','celebration','mauritania'],
    ARRAY['gluten-free','halal'],
    40, 180, 'hard', 10,
    'Mechoui is reserved for the most important celebrations — weddings, religious holidays, and the arrival of honoured guests. In Moor culture, the ability to prepare a perfect mechoui is a mark of great hospitality.',
    'Weddings and religious celebrations', 'Couscous, bread, and mint tea',
    480, 42, 2, 32, 0,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'kg', 'leg of lamb', 'bone-in', false, 'lamb shoulder'),
  (rid, 2, NULL, 4, 'tbsp', 'butter', 'softened', false, NULL),
  (rid, 3, NULL, 2, 'tbsp', 'ground cumin', NULL, false, NULL),
  (rid, 4, NULL, 1, 'tbsp', 'ground coriander', NULL, false, NULL),
  (rid, 5, NULL, 6, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, NULL, 1, 'tsp', 'paprika', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the rub', 'Mix softened butter with cumin, coriander, garlic, paprika, salt, and pepper into a paste.', NULL, NULL, NULL),
  (rid, 2, 'Prepare the lamb', 'Score the lamb deeply. Rub the butter-spice paste into every crevice, under the skin and into the scores. Let marinate at least 2 hours.', 7200, 'Marinate', 'Overnight marination is ideal.'),
  (rid, 3, 'Slow roast', 'Place in a roasting pan. Cover with foil. Roast at 150C for 3 hours, basting every 30 minutes with pan juices.', 10800, 'Slow roast', 'Low and slow is the key — the meat should fall off the bone.'),
  (rid, 4, 'Crisp the exterior', 'Remove foil. Increase oven to 220C and roast 15-20 minutes until the exterior is golden and crispy.', 1200, 'Crisp skin', NULL),
  (rid, 5, 'Serve', 'Rest 15 minutes before carving. Serve on a large platter with couscous and bread.', 900, 'Rest', NULL);
END $$;

-- 45. Lakh (Mauritania)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'lakh-mr', 'Lakh', 'Lakh', 'A sweet millet couscous porridge served with a fermented milk and sugar sauce. Mauritania''s traditional dessert and breakfast, creamy and nourishing.',
    'MR', 'Mauritania', 'West Africa', 'Fula', 'dessert',
    ARRAY['millet','milk','sweet','porridge','mauritania'],
    ARRAY['gluten-free','vegetarian'],
    15, 20, 'easy', 6,
    'Lakh is one of the few sweet dishes in the Sahelian culinary tradition. The combination of steamed millet couscous with cool, tangy fermented milk is both refreshing and sustaining, making it popular as both a dessert and a breakfast.',
    'Breakfast and dessert', 'Served on its own',
    340, 8, 56, 10, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'millet couscous', NULL, false, 'regular couscous'),
  (rid, 2, NULL, 2, 'cups', 'fermented milk (lait caillé)', NULL, false, 'plain yoghurt thinned with milk'),
  (rid, 3, NULL, 0.5, 'cup', 'sugar', NULL, false, 'honey'),
  (rid, 4, NULL, 2, 'tbsp', 'butter', NULL, false, NULL),
  (rid, 5, NULL, 0.5, 'tsp', 'vanilla extract', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Steam the couscous', 'Steam millet couscous in a steamer basket over boiling water for 15 minutes until fluffy and tender.', 900, 'Steam couscous', NULL),
  (rid, 2, 'Enrich the couscous', 'Toss the hot couscous with butter and a pinch of salt. Fluff with a fork.', NULL, NULL, NULL),
  (rid, 3, 'Make the sauce', 'Whisk fermented milk with sugar and vanilla until smooth and pourable.', NULL, NULL, 'The sauce should be cool — the contrast with warm couscous is the magic.'),
  (rid, 4, 'Serve', 'Mound couscous in bowls and pour the sweet milk sauce generously over the top. Serve immediately.', NULL, NULL, NULL);
END $$;

-- =============================================
-- CAPE VERDE (CV)
-- =============================================

-- 46. Cachupa Rica (Cape Verde)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'cachupa-rica-cv', 'Cachupa Rica', 'Cachupa Rica', 'Cape Verde''s national dish — a rich, slow-cooked stew of hominy corn, beans, and multiple meats and sausages. The "rica" (rich) version is the celebratory feast edition.',
    'CV', 'Cape Verde', 'West Africa', 'Crioulo', 'stew',
    ARRAY['corn','beans','stew','national-dish','cape-verde'],
    ARRAY['gluten-free','dairy-free'],
    30, 120, 'hard', 8,
    'Cachupa is to Cape Verde what the soul itself is to its people. Every island has its own version, and the dish is said to embody the melting pot of African, Portuguese, and Brazilian influences that define Cape Verdean culture. Cachupa Rica is the celebratory version with multiple meats.',
    'National holidays and celebrations', 'Fried egg on top (for leftover cachupa)',
    620, 38, 52, 28, 10,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'dried hominy corn', 'soaked overnight', false, NULL),
  (rid, 2, NULL, 1, 'cup', 'dried kidney beans', 'soaked overnight', false, NULL),
  (rid, 3, NULL, 300, 'g', 'pork ribs', 'cut into pieces', false, NULL),
  (rid, 4, NULL, 200, 'g', 'linguiça (Portuguese sausage)', 'sliced', false, 'chorizo'),
  (rid, 5, NULL, 200, 'g', 'beef stew meat', 'cubed', false, NULL),
  (rid, 6, NULL, 2, 'medium', 'sweet potatoes', 'cubed', false, NULL),
  (rid, 7, NULL, 1, 'small', 'green cabbage', 'shredded', false, NULL),
  (rid, 8, NULL, 2, 'large', 'onions', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the corn and beans', 'Drain soaked corn and beans. Place in a large pot with fresh water and boil for 45 minutes until beginning to soften.', 2700, 'Cook corn and beans', 'The corn takes the longest — start with it.'),
  (rid, 2, 'Add the meats', 'Add pork ribs, beef, and sausage to the pot. Season with salt, garlic, and bay leaves. Continue simmering for 30 minutes.', 1800, 'Cook meats', NULL),
  (rid, 3, 'Add vegetables', 'Add sweet potatoes, cabbage, onions, and any other vegetables. Cook for another 25-30 minutes until everything is tender.', 1800, 'Cook vegetables', NULL),
  (rid, 4, 'Adjust consistency', 'The cachupa should be thick and hearty — more stew than soup. If too watery, cook uncovered to reduce. If too thick, add a little water.', NULL, NULL, 'Cachupa tastes even better the next day, reheated and fried.'),
  (rid, 5, 'Serve', 'Ladle into deep bowls. Each serving should have a generous mix of corn, beans, meats, and vegetables.', NULL, NULL, NULL);
END $$;

-- 47. Pastel com Diablo Dentro (Cape Verde)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'pastel-diablo-cv', 'Pastel com Diablo Dentro', 'Pastel com Diablo Dentro', 'Cape Verdean fried pastries stuffed with a fiery tuna and tomato filling. The name means "pastry with the devil inside" due to the spicy filling.',
    'CV', 'Cape Verde', 'West Africa', 'Crioulo', 'snack',
    ARRAY['pastry','tuna','fried','spicy','cape-verde'],
    ARRAY['dairy-free'],
    40, 20, 'medium', 8,
    'These fiery little pastries are a staple of Cape Verdean street food and celebrations. The "devil inside" is the combination of malagueta peppers and spiced tuna that gives an unexpected kick with every bite.',
    'Street food and celebrations', 'On its own as a snack',
    280, 14, 28, 12, 2,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Dough', 3, 'cups', 'all-purpose flour', NULL, false, NULL),
  (rid, 2, 'Dough', 0.5, 'cup', 'warm water', NULL, false, NULL),
  (rid, 3, 'Dough', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 4, 'Filling', 300, 'g', 'canned tuna', 'drained and flaked', false, NULL),
  (rid, 5, 'Filling', 2, 'medium', 'tomatoes', 'finely chopped', false, NULL),
  (rid, 6, 'Filling', 1, 'large', 'onion', 'finely chopped', false, NULL),
  (rid, 7, 'Filling', 2, 'whole', 'malagueta peppers', 'finely chopped', false, 'scotch bonnet'),
  (rid, 8, 'Frying', 3, 'cups', 'vegetable oil', 'for deep frying', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the dough', 'Mix flour, oil, salt, and warm water into a smooth dough. Knead for 5 minutes until elastic. Rest 30 minutes covered.', 1800, 'Rest dough', NULL),
  (rid, 2, 'Make the filling', 'Fry onion until soft. Add tomatoes and peppers, cook 5 minutes. Add tuna and cook 5 more minutes until dry. Season well.', 600, 'Cook filling', 'The filling must be dry — wet filling makes soggy pastels.'),
  (rid, 3, 'Assemble', 'Roll dough thin. Cut into circles. Place a spoonful of filling in the centre, fold into half-moons, and seal edges with a fork.', NULL, NULL, NULL),
  (rid, 4, 'Fry', 'Deep fry in oil at 180C until golden brown and crispy, about 3-4 minutes.', 240, 'Fry pastels', 'Fry in batches without crowding.'),
  (rid, 5, 'Serve', 'Drain on paper towels. Serve hot.', NULL, NULL, NULL);
END $$;

-- 48. Canja de Galinha (Cape Verde)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'canja-cv', 'Canja de Galinha', 'Canja', 'A comforting Cape Verdean chicken and rice soup with vegetables and a squeeze of lime. The Cape Verdean version of the Portuguese classic, adapted with local spices.',
    'CV', 'Cape Verde', 'West Africa', 'Crioulo', 'soup',
    ARRAY['chicken','rice','soup','comfort-food','cape-verde'],
    ARRAY['gluten-free','dairy-free','halal'],
    20, 45, 'easy', 6,
    'Canja was brought to Cape Verde by Portuguese colonists and has become a cherished comfort food. It is the first dish offered to the sick, to new mothers, and to anyone in need of nourishment and warmth.',
    'Comfort food and recovery meals', 'Crusty bread',
    320, 26, 32, 10, 3,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'chicken pieces', 'bone-in', false, NULL),
  (rid, 2, NULL, 0.75, 'cup', 'rice', NULL, false, NULL),
  (rid, 3, NULL, 2, 'medium', 'carrots', 'diced', false, NULL),
  (rid, 4, NULL, 1, 'large', 'onion', 'chopped', false, NULL),
  (rid, 5, NULL, 2, 'whole', 'limes', 'juiced', false, NULL),
  (rid, 6, NULL, 3, 'cloves', 'garlic', 'minced', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the chicken', 'Place chicken in a pot with 6 cups water, onion, garlic, and salt. Boil until tender, about 25 minutes. Remove chicken, shred the meat, discard bones.', 1500, 'Cook chicken', NULL),
  (rid, 2, 'Add rice and vegetables', 'Add rice and carrots to the broth. Simmer for 15 minutes until rice is cooked and carrots are tender.', 900, 'Cook rice', NULL),
  (rid, 3, 'Return chicken', 'Add shredded chicken back to the soup. Season with salt, pepper, and a generous squeeze of lime.', NULL, NULL, NULL),
  (rid, 4, 'Serve', 'Ladle into bowls and serve hot with extra lime wedges and crusty bread.', NULL, NULL, NULL);
END $$;

-- =============================================
-- SAO TOME AND PRINCIPE (ST)
-- =============================================

-- 49. Calulu (Sao Tome and Principe)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'calulu-st', 'Calulu', 'Calulu', 'Sao Tome''s national dish — smoked and dried fish stewed with okra, tomatoes, and palm oil, layered with eggplant and served over mashed breadfruit or banana.',
    'ST', 'São Tomé and Príncipe', 'West Africa', 'Forro', 'stew',
    ARRAY['fish','okra','palm-oil','national-dish','sao-tome'],
    ARRAY['gluten-free','dairy-free','pescatarian'],
    30, 60, 'medium', 6,
    'Calulu is the soul of Santomean cuisine, a dish that reflects the island''s Portuguese colonial past and African roots. It is prepared for every important occasion, from family Sunday lunches to national independence celebrations.',
    'National celebrations and Sunday lunch', 'Mashed breadfruit or banana (angú)',
    420, 28, 20, 26, 6,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 300, 'g', 'smoked fish', 'soaked and deboned', false, NULL),
  (rid, 2, NULL, 300, 'g', 'dried fish', 'soaked and deboned', false, NULL),
  (rid, 3, NULL, 300, 'g', 'fresh okra', 'sliced', false, NULL),
  (rid, 4, NULL, 4, 'medium', 'tomatoes', 'chopped', false, NULL),
  (rid, 5, NULL, 1, 'medium', 'eggplant', 'cubed', false, NULL),
  (rid, 6, NULL, 0.25, 'cup', 'palm oil', NULL, false, NULL),
  (rid, 7, NULL, 2, 'large', 'onions', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the fish', 'Soak smoked and dried fish separately in warm water for 30 minutes. Debone and break into large chunks.', 1800, 'Soak fish', NULL),
  (rid, 2, 'Layer the stew', 'In a heavy pot, layer palm oil, onions, tomatoes, eggplant, okra, and both types of fish. Season each layer with salt and pepper.', NULL, NULL, 'Layering builds complex flavours — do not stir at this stage.'),
  (rid, 3, 'Slow cook', 'Cover tightly. Cook on the lowest heat for 45 minutes, shaking the pot occasionally but not stirring.', 2700, 'Slow cook', 'The stew cooks in its own juices — do not add water.'),
  (rid, 4, 'Check and stir', 'After 45 minutes, gently stir from the bottom. The okra should have thickened the sauce. Simmer 10 more minutes.', 600, 'Final simmer', NULL),
  (rid, 5, 'Serve', 'Serve over mashed breadfruit or plantain (angú).', NULL, NULL, NULL);
END $$;

-- 50. Angú de Banana (Sao Tome and Principe)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'angu-de-banana-st', 'Angú de Banana', 'Angú de Banana', 'Mashed green banana with palm oil, creating a smooth, savoury side dish. The traditional accompaniment to calulu and other Santomean stews.',
    'ST', 'São Tomé and Príncipe', 'West Africa', 'Forro', 'side',
    ARRAY['banana','plantain','mashed','sao-tome'],
    ARRAY['vegan','gluten-free','dairy-free'],
    10, 20, 'easy', 6,
    'Angú de banana is as fundamental to Santomean cuisine as rice is to much of West Africa. The green bananas are boiled and mashed with palm oil to create a smooth, starchy base that perfectly absorbs rich stews.',
    'Daily staple', 'Calulu or any stew',
    240, 3, 54, 4, 4,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 6, 'whole', 'green bananas', 'peeled', false, 'green plantains'),
  (rid, 2, NULL, 2, 'tbsp', 'palm oil', NULL, false, NULL),
  (rid, 3, NULL, 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, NULL, 1, 'cup', 'water', 'for boiling', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil the bananas', 'Place peeled green bananas in salted boiling water. Cook until very soft, about 15-20 minutes.', 1200, 'Boil bananas', 'They should be completely soft — undercooked bananas won''t mash smoothly.'),
  (rid, 2, 'Mash', 'Drain the bananas. Mash with a potato masher or wooden pestle until completely smooth with no lumps.', NULL, NULL, NULL),
  (rid, 3, 'Add palm oil', 'Stir in palm oil and salt. Mix until the angú is smooth, golden, and uniform.', NULL, NULL, 'The palm oil gives it a beautiful golden colour and rich flavour.'),
  (rid, 4, 'Serve', 'Shape into a mound and serve alongside calulu or other stews.', NULL, NULL, NULL);
END $$;

-- 51. Chocolate de Sao Tome (Sao Tome and Principe)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'chocolate-quente-st', 'Sao Tomean Hot Chocolate', 'Chocolate Quente', 'A thick, rich hot chocolate made from locally grown cacao beans. Sao Tome produces some of the world''s finest cacao, and this drink showcases it beautifully.',
    'ST', 'São Tomé and Príncipe', 'West Africa', 'Forro', 'drink',
    ARRAY['chocolate','cacao','hot-drink','sao-tome'],
    ARRAY['gluten-free','vegetarian'],
    10, 15, 'easy', 4,
    'Sao Tome and Principe was once the world''s largest cacao producer. While production has decreased, the quality of Santomean cacao remains exceptional. This hot chocolate uses raw cacao for an authentic, intense flavour.',
    'Morning drink and dessert', 'Bread or pastries',
    280, 6, 28, 16, 4,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 100, 'g', 'dark chocolate or cacao mass', 'roughly chopped', false, 'unsweetened cocoa powder'),
  (rid, 2, NULL, 3, 'cups', 'whole milk', NULL, false, NULL),
  (rid, 3, NULL, 0.25, 'cup', 'sugar', NULL, false, 'honey'),
  (rid, 4, NULL, 1, 'stick', 'cinnamon', NULL, false, NULL),
  (rid, 5, NULL, 0.25, 'tsp', 'vanilla extract', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Heat the milk', 'Pour milk into a saucepan with the cinnamon stick. Heat on medium until steaming but not boiling.', 300, 'Heat milk', NULL),
  (rid, 2, 'Melt the chocolate', 'Add chopped chocolate or cacao mass to the hot milk. Stir constantly until fully melted and smooth.', 180, 'Melt chocolate', 'Use high-quality chocolate for the best result.'),
  (rid, 3, 'Sweeten', 'Add sugar and vanilla. Stir until dissolved. Continue heating for 5 minutes, whisking to create a frothy texture.', 300, 'Cook chocolate', NULL),
  (rid, 4, 'Serve', 'Remove cinnamon stick. Pour into cups and serve immediately while hot and frothy.', NULL, NULL, 'For extra richness, add a splash of coconut milk.');
END $$;
