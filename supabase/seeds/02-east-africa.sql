-- ============================================================================
-- AfroKitchen Seed Data: East Africa (18 countries, 54 recipes)
-- ============================================================================

-- =========================
-- KENYA (KE) - 3 recipes
-- =========================

-- 1. Ugali na Sukuma Wiki
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'ugali-na-sukuma-wiki', 'Ugali na Sukuma Wiki', 'Ugali na Sukuma Wiki',
    'Kenya''s beloved staple of firm maize porridge served with sauteed collard greens, onions, and tomatoes.',
    'KE', 'Kenya', 'East Africa', 'main',
    ARRAY['staple','comfort-food','everyday'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    15, 30, 'easy', 4,
    'Ugali na Sukuma Wiki is the heartbeat of Kenyan cuisine, eaten daily across all social classes. "Sukuma wiki" literally translates to "push the week," reflecting its role as an affordable green that stretches meals. No Kenyan table is complete without this humble yet satisfying combination.',
    320, 8, 58, 7, 6, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Ugali', 2, 'cups', 'white maize flour', 'fine-ground', false, 'cornmeal'),
  (rid, 2, 'Ugali', 3, 'cups', 'water', NULL, false, NULL),
  (rid, 3, 'Ugali', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, 'Sukuma Wiki', 1, 'bunch', 'collard greens', 'stems removed, thinly sliced', false, 'kale'),
  (rid, 5, 'Sukuma Wiki', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 6, 'Sukuma Wiki', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 7, 'Sukuma Wiki', 2, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 8, 'Sukuma Wiki', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 9, 'Sukuma Wiki', 1, 'whole', 'green chili', 'sliced', true, NULL),
  (rid, 10, 'Sukuma Wiki', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 11, 'Sukuma Wiki', 1, 'whole', 'lemon', 'juiced', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil Water', 'Bring 3 cups of water to a rolling boil in a heavy-bottomed pot. Add salt.', 600, 'Boil water', 'Use a heavy wooden spoon (mwiko) for stirring ugali — it makes a big difference.'),
  (rid, 2, 'Make Ugali', 'Reduce heat to medium. Gradually add maize flour while stirring vigorously to avoid lumps. Keep stirring until the mixture pulls away from the sides and forms a firm dough.', 900, 'Cook ugali', 'Press against the pot sides to test — it should be firm but not dry.'),
  (rid, 3, 'Shape Ugali', 'Wet a plate and turn the ugali onto it. Shape into a dome using a wet spoon. Cover to keep warm.', NULL, NULL, NULL),
  (rid, 4, 'Saute Aromatics', 'Heat oil in a pan over medium heat. Saute onions until golden, then add garlic and tomatoes. Cook until tomatoes break down.', 600, 'Saute', NULL),
  (rid, 5, 'Cook Greens', 'Add the sliced sukuma wiki and chili. Toss to coat with the tomato mixture. Cover and cook until wilted but still vibrant green.', 480, 'Wilt greens', 'Do not overcook — sukuma wiki should retain a slight bite and bright color.'),
  (rid, 6, 'Season and Serve', 'Season with salt and squeeze lemon juice over the greens. Serve alongside the ugali dome.', NULL, NULL, 'Traditionally eaten with hands — pinch ugali with three fingers, make an indent, and scoop.');
END $$;

-- 2. Nyama Choma
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'nyama-choma', 'Nyama Choma', 'Nyama Choma',
    'Kenya''s iconic grilled goat or beef marinated with salt and lemon, roasted over charcoal to smoky perfection.',
    'KE', 'Kenya', 'East Africa', 'main',
    ARRAY['grilled','barbecue','celebration'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    30, 60, 'medium', 6,
    'Nyama Choma means "roasted meat" in Swahili and is more than food — it is a social ritual. Kenyans gather at open-air joints on weekends to share platters of smoky meat with cold Tusker beer. The best nyama choma is cooked slowly over hot coals with minimal seasoning.',
    450, 42, 2, 30, 0, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Meat', 2, 'kg', 'goat leg', 'bone-in, cut into large pieces', false, 'beef ribs'),
  (rid, 2, 'Marinade', 2, 'whole', 'lemons', 'juiced', false, NULL),
  (rid, 3, 'Marinade', 1, 'tbsp', 'coarse salt', NULL, false, NULL),
  (rid, 4, 'Marinade', 1, 'tsp', 'black pepper', 'freshly ground', false, NULL),
  (rid, 5, 'Marinade', 4, 'cloves', 'garlic', 'crushed', false, NULL),
  (rid, 6, 'Marinade', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 7, 'Marinade', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 8, 'Kachumbari', 3, 'whole', 'tomatoes', 'diced', false, NULL),
  (rid, 9, 'Kachumbari', 1, 'whole', 'red onion', 'thinly sliced', false, NULL),
  (rid, 10, 'Kachumbari', 1, 'whole', 'green chili', 'minced', true, NULL),
  (rid, 11, 'Kachumbari', 0.25, 'cup', 'fresh cilantro', 'chopped', false, NULL),
  (rid, 12, 'Kachumbari', 1, 'whole', 'lime', 'juiced', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Marinate Meat', 'Combine lemon juice, salt, pepper, garlic, ginger, and oil. Rub into goat pieces. Marinate at least 2 hours or overnight.', NULL, NULL, 'Overnight marination with lemon juice tenderizes goat meat.'),
  (rid, 2, 'Prepare Charcoal', 'Light charcoal grill and let coals burn until covered with white ash. Spread evenly for indirect heat.', 1800, 'Heat coals', NULL),
  (rid, 3, 'Grill Meat', 'Place meat on grill over medium heat. Cook slowly, turning every 10 minutes, until deeply browned and cooked through.', 3600, 'Grill', 'Low and slow is the secret — resist high heat.'),
  (rid, 4, 'Make Kachumbari', 'Combine diced tomatoes, sliced onion, chili, cilantro, and lime juice. Season with salt and toss.', NULL, NULL, NULL),
  (rid, 5, 'Rest and Serve', 'Remove meat from grill, rest 5 minutes, then chop into pieces on a wooden board. Serve with kachumbari and ugali.', 300, 'Rest meat', 'In Kenya, nyama choma is always served on a wooden board with toothpicks.');
END $$;

-- 3. Kenyan Pilau
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kenyan-pilau', 'Kenyan Pilau', 'Pilau',
    'Fragrant spiced rice with caramelized onions, pilau masala, and tender beef — a Swahili Coast masterpiece.',
    'KE', 'Kenya', 'East Africa', 'main',
    ARRAY['rice','spiced','swahili','one-pot'],
    ARRAY['dairy-free','nut-free','halal'],
    20, 60, 'medium', 6,
    'Pilau arrived on the Kenyan coast through centuries of trade with Arab, Indian, and Persian merchants. Every family has their own pilau masala blend and the dish is a centerpiece at weddings, Eid celebrations, and Sunday lunches. Deeply caramelized onions give it that signature dark color.',
    520, 25, 62, 18, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Rice', 3, 'cups', 'basmati rice', 'soaked 30 min, drained', false, NULL),
  (rid, 2, 'Meat', 500, 'g', 'beef', 'cubed', false, 'chicken'),
  (rid, 3, 'Aromatics', 3, 'whole', 'onions', 'thinly sliced', false, NULL),
  (rid, 4, 'Aromatics', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, 'Aromatics', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 6, 'Spices', 2, 'tbsp', 'pilau masala', NULL, false, NULL),
  (rid, 7, 'Spices', 4, 'whole', 'cardamom pods', 'crushed', false, NULL),
  (rid, 8, 'Spices', 1, 'stick', 'cinnamon', NULL, false, NULL),
  (rid, 9, 'Spices', 4, 'whole', 'cloves', NULL, false, NULL),
  (rid, 10, 'Spices', 1, 'tsp', 'cumin seeds', NULL, false, NULL),
  (rid, 11, 'Cooking', 3, 'tbsp', 'vegetable oil', NULL, false, 'ghee'),
  (rid, 12, 'Cooking', 4, 'cups', 'beef stock', 'hot', false, NULL),
  (rid, 13, 'Cooking', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 14, 'Garnish', 0.25, 'cup', 'fresh cilantro', 'chopped', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown Meat', 'Heat oil in a heavy pot over high heat. Season beef with salt and sear until browned on all sides. Remove and set aside.', 600, 'Sear beef', NULL),
  (rid, 2, 'Caramelize Onions', 'In the same pot, add sliced onions. Cook over medium heat, stirring occasionally, until deeply golden brown.', 1200, 'Caramelize', 'Do not rush — deeply browned onions give pilau its signature color and sweetness.'),
  (rid, 3, 'Bloom Spices', 'Add garlic, ginger, cardamom, cinnamon, cloves, cumin, and pilau masala. Stir 1 minute until fragrant. Return beef to pot.', 60, 'Bloom spices', NULL),
  (rid, 4, 'Cook Rice', 'Add drained rice and stir to coat. Pour in hot stock. Bring to a boil, reduce to lowest heat, cover tightly and cook until rice is fluffy and liquid absorbed.', 1200, 'Cook rice', 'Place a clean towel under the lid to absorb excess steam for fluffier rice.'),
  (rid, 5, 'Rest and Fluff', 'Remove from heat, rest covered 10 minutes. Fluff gently with a fork.', 600, 'Rest', NULL),
  (rid, 6, 'Serve', 'Mound pilau on a platter, garnish with cilantro. Serve with kachumbari and lemon wedges.', NULL, NULL, 'Pilau is traditionally served at celebrations — make extra.');
END $$;

-- =========================
-- ETHIOPIA (ET) - 3 recipes
-- =========================

-- 4. Doro Wat
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'doro-wat', 'Doro Wat', 'ዶሮ ወጥ',
    'Ethiopia''s celebrated spicy chicken stew simmered in berbere spice and niter kibbeh, served with hard-boiled eggs on injera.',
    'ET', 'Ethiopia', 'East Africa', 'stew',
    ARRAY['chicken','spicy','celebration','slow-cooked'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    30, 90, 'hard', 6,
    'Doro Wat is the crown jewel of Ethiopian cuisine, reserved for holidays and special occasions. Traditionally prepared for Ethiopian Christmas (Genna) and Easter (Fasika), the dish requires patience — onions are slow-cooked for over an hour without oil until they form a rich base. Each hard-boiled egg is scored to absorb the fiery berbere sauce.',
    480, 35, 18, 28, 3, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Chicken', 1.5, 'kg', 'chicken', 'cut into 12 pieces, skin removed', false, NULL),
  (rid, 2, 'Chicken', 2, 'whole', 'lemons', 'juiced', false, NULL),
  (rid, 3, 'Stew Base', 4, 'whole', 'red onions', 'very finely diced', false, NULL),
  (rid, 4, 'Stew Base', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, 'Stew Base', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 6, 'Stew Base', 3, 'tbsp', 'berbere spice', NULL, false, NULL),
  (rid, 7, 'Stew Base', 3, 'tbsp', 'niter kibbeh', NULL, false, 'clarified butter with spices'),
  (rid, 8, 'Stew Base', 1, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 9, 'Stew Base', 0.5, 'cup', 'water', NULL, false, NULL),
  (rid, 10, 'Stew Base', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 11, 'Stew Base', 0.5, 'tsp', 'black pepper', NULL, false, NULL),
  (rid, 12, 'Stew Base', 0.25, 'tsp', 'cardamom', 'ground', false, NULL),
  (rid, 13, 'Eggs', 6, 'whole', 'eggs', 'hard-boiled, peeled, scored', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Marinate Chicken', 'Rub chicken pieces with lemon juice and salt. Set aside for 30 minutes.', 1800, 'Marinate', 'The lemon bath removes gamey flavors and tenderizes the meat.'),
  (rid, 2, 'Dry-Cook Onions', 'Place finely diced onions in a dry heavy pot over medium heat. Stir frequently until onions are deeply browned and reduced by half. Do not add oil or water.', 2400, 'Dry-cook onions', 'This is the most important step — patience here builds the stew''s depth of flavor.'),
  (rid, 3, 'Build Sauce', 'Add niter kibbeh, garlic, ginger, and berbere spice. Stir continuously for 5 minutes. Add tomato paste and water. Simmer until oil separates from sauce.', 1800, 'Simmer sauce', NULL),
  (rid, 4, 'Cook Chicken', 'Add chicken pieces to the sauce, turning to coat. Cover and simmer on low heat until chicken is very tender and sauce is thick.', 2700, 'Simmer chicken', NULL),
  (rid, 5, 'Add Eggs', 'Score each hard-boiled egg with a knife in a crosshatch pattern. Nestle eggs into the stew and simmer 10 more minutes so they absorb the sauce.', 600, 'Simmer eggs', 'Scoring the eggs lets the berbere flavor penetrate — the deeper the cuts, the more flavorful.'),
  (rid, 6, 'Serve', 'Ladle doro wat onto a large platter of injera. Place eggs on top. Serve with extra injera on the side for scooping.', NULL, NULL, 'Eat communally from a shared platter — it is called "gursha" when you hand-feed someone a morsel.');
END $$;

-- 5. Injera
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'injera', 'Injera', 'እንጀራ',
    'Ethiopia''s signature sourdough flatbread made from teff flour — spongy, tangy, and used as both plate and utensil.',
    'ET', 'Ethiopia', 'East Africa', 'side',
    ARRAY['bread','fermented','staple','sourdough'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free'],
    20, 30, 'hard', 8,
    'Injera is the foundation of Ethiopian cuisine, serving as plate, utensil, and flavor companion all at once. Made from teff, a tiny grain native to the Ethiopian highlands, the batter is fermented for days to achieve its signature sour tang. A meal without injera is not considered a meal in Ethiopia.',
    180, 5, 36, 1, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Batter', 2, 'cups', 'teff flour', NULL, false, 'buckwheat flour'),
  (rid, 2, 'Batter', 3, 'cups', 'water', 'lukewarm', false, NULL),
  (rid, 3, 'Batter', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, 'Batter', 0.25, 'tsp', 'baking powder', 'optional for quicker rise', true, NULL),
  (rid, 5, 'Starter', 1, 'tbsp', 'sourdough starter', 'or reserved batter from previous batch', true, NULL),
  (rid, 6, 'Cooking', 1, 'tsp', 'vegetable oil', 'for greasing', false, NULL),
  (rid, 7, 'Batter', 0.5, 'cup', 'water', 'for adjusting consistency', false, NULL),
  (rid, 8, 'Batter', 0.5, 'cup', 'teff flour', 'for absit starter', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Mix Batter', 'Whisk teff flour and lukewarm water together until smooth with no lumps. Cover loosely with a cloth and leave at room temperature to ferment for 2-3 days.', NULL, NULL, 'The batter should bubble and develop a sour smell — that means fermentation is working.'),
  (rid, 2, 'Make Absit', 'On cooking day, mix half cup teff flour with one cup water in a small pot. Cook over medium heat, stirring constantly, until it thickens into a paste. Let cool, then stir into the fermented batter.', 300, 'Cook absit', 'Absit helps the injera develop its characteristic eye-holes on the surface.'),
  (rid, 3, 'Adjust Batter', 'The batter should be thin like crepe batter. Add water if too thick. Add salt and stir well. Pour off any liquid that accumulated on top during fermentation.', NULL, NULL, NULL),
  (rid, 4, 'Cook Injera', 'Heat a large non-stick skillet or mitad over medium heat. Lightly oil. Pour batter in a spiral from outside to center. Cover and cook until eyes form on surface and edges lift from pan. Do not flip.', 120, 'Cook one injera', 'Only cook on one side — injera should be spongy on top and smooth on the bottom.'),
  (rid, 5, 'Cool and Stack', 'Carefully remove injera and place on a clean cloth to cool. Repeat with remaining batter, stacking cooled injera between layers of cloth.', NULL, NULL, NULL),
  (rid, 6, 'Serve', 'Lay one large injera on a platter and spoon various wats and salads on top. Roll extra injera and serve alongside for tearing and scooping.', NULL, NULL, 'Fresh injera should be flexible enough to roll without cracking.');
END $$;

-- 6. Kitfo
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kitfo', 'Kitfo', 'ክትፎ',
    'Ethiopian steak tartare — finely minced raw beef seasoned with mitmita spice and warm niter kibbeh, served with ayib cheese and gomen.',
    'ET', 'Ethiopia', 'East Africa', 'main',
    ARRAY['raw','beef','traditional','gurage'],
    ARRAY['gluten-free','nut-free'],
    20, 5, 'medium', 4,
    'Kitfo originates from the Gurage people of southern Ethiopia and is considered one of the finest dishes in Ethiopian cuisine. Traditionally eaten raw (tere), it can also be served lightly warmed (leb leb) or fully cooked (yebesele). It is a festive dish often served at weddings and celebrations.',
    380, 30, 2, 28, 0, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Kitfo', 500, 'g', 'beef tenderloin', 'very finely minced', false, NULL),
  (rid, 2, 'Kitfo', 3, 'tbsp', 'niter kibbeh', 'warmed', false, 'spiced clarified butter'),
  (rid, 3, 'Kitfo', 1, 'tbsp', 'mitmita spice', NULL, false, NULL),
  (rid, 4, 'Kitfo', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 5, 'Kitfo', 0.5, 'tsp', 'cardamom', 'ground', false, NULL),
  (rid, 6, 'Ayib', 1, 'cup', 'fresh cottage cheese', 'drained', false, 'ricotta'),
  (rid, 7, 'Ayib', 1, 'tbsp', 'lemon juice', NULL, false, NULL),
  (rid, 8, 'Gomen', 1, 'bunch', 'collard greens', 'chopped', false, 'kale'),
  (rid, 9, 'Gomen', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 10, 'Gomen', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 11, 'Gomen', 1, 'tbsp', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare Beef', 'Using a very sharp knife, mince the beef tenderloin as finely as possible. The meat should have an almost paste-like consistency.', NULL, NULL, 'Use the freshest, highest-quality beef you can find — this dish is traditionally served raw.'),
  (rid, 2, 'Make Gomen', 'Saute onion and garlic in oil until softened. Add collard greens and cook until tender but still green, about 8 minutes. Season with salt.', 480, 'Cook gomen', NULL),
  (rid, 3, 'Prepare Ayib', 'Mix cottage cheese with lemon juice and a pinch of salt. Set aside at room temperature.', NULL, NULL, NULL),
  (rid, 4, 'Season Kitfo', 'Warm niter kibbeh in a pan until just melted. In a bowl, combine minced beef, warm niter kibbeh, mitmita, cardamom, and salt. Mix gently with your hands until evenly combined.', NULL, NULL, 'For leb leb style, briefly warm the seasoned meat in a pan for 1-2 minutes — still pink inside.'),
  (rid, 5, 'Plate and Serve', 'Mound the kitfo in the center of a plate or injera. Place ayib on one side and gomen on the other. Serve immediately with extra injera for scooping.', NULL, NULL, 'Kitfo should be served immediately — it does not keep well once seasoned.');
END $$;

-- =========================
-- TANZANIA (TZ) - 3 recipes
-- =========================

-- 7. Ugali na Nyama
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'ugali-na-nyama', 'Ugali na Nyama', 'Ugali na Nyama',
    'Tanzanian staple of firm maize porridge paired with slow-simmered beef stew in a rich tomato sauce.',
    'TZ', 'Tanzania', 'East Africa', 'main',
    ARRAY['staple','comfort-food','beef','everyday'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    15, 60, 'easy', 4,
    'Ugali na Nyama is the everyday meal of Tanzania, from Dar es Salaam to the slopes of Kilimanjaro. The beef stew (mchuzi wa nyama) varies by region — coastal versions add coconut milk, while inland versions use tomatoes and peppers. It is the dish that every Tanzanian mother teaches first.',
    480, 32, 50, 16, 4, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Ugali', 2, 'cups', 'white maize flour', NULL, false, NULL),
  (rid, 2, 'Ugali', 3, 'cups', 'water', NULL, false, NULL),
  (rid, 3, 'Nyama', 500, 'g', 'beef chuck', 'cubed', false, NULL),
  (rid, 4, 'Nyama', 2, 'whole', 'onions', 'diced', false, NULL),
  (rid, 5, 'Nyama', 3, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 6, 'Nyama', 2, 'whole', 'bell peppers', 'diced', false, NULL),
  (rid, 7, 'Nyama', 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 8, 'Nyama', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 9, 'Nyama', 1, 'tsp', 'curry powder', NULL, false, NULL),
  (rid, 10, 'Nyama', 1, 'cup', 'beef stock', NULL, false, NULL),
  (rid, 11, 'Nyama', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 12, 'Nyama', 0.5, 'tsp', 'black pepper', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown Beef', 'Heat oil in a heavy pot. Season beef with salt and pepper, then sear until browned on all sides.', 600, 'Sear', NULL),
  (rid, 2, 'Cook Aromatics', 'Add onions and garlic, cook until softened. Add bell peppers, tomatoes, and curry powder. Stir well.', 480, 'Saute', 'Crush the tomatoes with your spoon to release their juices.'),
  (rid, 3, 'Simmer Stew', 'Pour in beef stock. Bring to a boil, then reduce heat. Cover and simmer until beef is fork-tender.', 2700, 'Simmer', 'Low heat and patience make the beef meltingly tender.'),
  (rid, 4, 'Make Ugali', 'Bring 3 cups water to a boil. Gradually add maize flour, stirring vigorously until firm and pulling from sides of pot.', 900, 'Cook ugali', NULL),
  (rid, 5, 'Serve', 'Turn ugali onto a wet plate in a dome shape. Ladle the beef stew alongside. Serve hot.', NULL, NULL, 'Tanzanians say the stew should be thick enough to cling to the ugali, not soupy.');
END $$;

-- 8. Tanzanian Pilau
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'tanzanian-pilau', 'Tanzanian Pilau', 'Pilau ya Tanganyika',
    'Zanzibar-influenced spiced rice with meat, potatoes, and a blend of whole spices cooked in caramelized onions.',
    'TZ', 'Tanzania', 'East Africa', 'main',
    ARRAY['rice','spiced','zanzibar','one-pot'],
    ARRAY['dairy-free','nut-free','halal'],
    25, 55, 'medium', 6,
    'Tanzanian Pilau reflects the Zanzibari spice trade that shaped East African cuisine for centuries. The island of Zanzibar, once the world''s largest clove producer, infused mainland cooking with cardamom, cinnamon, and cumin. This pilau is distinguished from its Kenyan cousin by the addition of potatoes and a slightly different spice balance.',
    510, 22, 65, 17, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 3, 'cups', 'basmati rice', 'soaked 30 min', false, NULL),
  (rid, 2, 'Main', 400, 'g', 'beef', 'cubed', false, 'lamb'),
  (rid, 3, 'Main', 2, 'whole', 'potatoes', 'peeled, quartered', false, NULL),
  (rid, 4, 'Main', 3, 'whole', 'onions', 'thinly sliced', false, NULL),
  (rid, 5, 'Main', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, 'Spices', 6, 'whole', 'cardamom pods', 'cracked', false, NULL),
  (rid, 7, 'Spices', 1, 'stick', 'cinnamon', NULL, false, NULL),
  (rid, 8, 'Spices', 6, 'whole', 'cloves', NULL, false, NULL),
  (rid, 9, 'Spices', 1, 'tsp', 'cumin seeds', NULL, false, NULL),
  (rid, 10, 'Spices', 1, 'tsp', 'black peppercorns', NULL, false, NULL),
  (rid, 11, 'Cooking', 3, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 12, 'Cooking', 4.5, 'cups', 'beef stock', 'hot', false, NULL),
  (rid, 13, 'Cooking', 1.5, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Toast Spices', 'Dry-toast cardamom, cinnamon, cloves, cumin, and peppercorns in a hot pan until fragrant. Set aside.', 120, 'Toast', 'Toasting whole spices releases their essential oils for deeper flavor.'),
  (rid, 2, 'Caramelize Onions', 'Heat oil in a heavy pot. Add onions and cook until deeply browned and caramelized.', 1200, 'Caramelize', NULL),
  (rid, 3, 'Brown Meat', 'Add beef and garlic to onions. Sear until browned. Add toasted spices and potatoes. Stir to coat.', 600, 'Brown', NULL),
  (rid, 4, 'Cook Pilau', 'Add drained rice and hot stock. Bring to a boil, then reduce to lowest heat. Cover tightly and cook until rice is tender and liquid absorbed.', 1200, 'Cook rice', 'Do not lift the lid during cooking — the steam does the work.'),
  (rid, 5, 'Rest and Serve', 'Remove from heat. Let rest covered for 10 minutes, then fluff with a fork. Serve garnished with fresh lime wedges.', 600, 'Rest', NULL);
END $$;

-- 9. Chipsi Mayai
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'chipsi-mayai', 'Chipsi Mayai', 'Chipsi Mayai',
    'Tanzania''s beloved street food — a crispy french fry omelette, golden on the outside and loaded with chips inside.',
    'TZ', 'Tanzania', 'East Africa', 'snack',
    ARRAY['street-food','eggs','quick','popular'],
    ARRAY['gluten-free','dairy-free','nut-free','halal','vegetarian'],
    10, 20, 'easy', 2,
    'Chipsi Mayai, literally "chips eggs" in Swahili, is Tanzania''s most iconic street food. Found at every corner food stall in Dar es Salaam, this indulgent combination of french fries and eggs is the ultimate comfort food. It is the go-to meal for students, workers, and anyone needing a quick, affordable, and filling bite.',
    580, 18, 52, 34, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Chips', 4, 'whole', 'potatoes', 'cut into thick fries', false, NULL),
  (rid, 2, 'Chips', 2, 'cups', 'vegetable oil', 'for deep frying', false, NULL),
  (rid, 3, 'Omelette', 4, 'whole', 'eggs', 'beaten', false, NULL),
  (rid, 4, 'Omelette', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 5, 'Omelette', 1, 'whole', 'tomato', 'diced', false, NULL),
  (rid, 6, 'Omelette', 1, 'whole', 'green chili', 'minced', true, NULL),
  (rid, 7, 'Omelette', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 8, 'Omelette', 0.25, 'tsp', 'black pepper', NULL, false, NULL),
  (rid, 9, 'Serving', 1, 'tbsp', 'ketchup', NULL, true, NULL),
  (rid, 10, 'Serving', 1, 'tbsp', 'pili pili sauce', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Fry Chips', 'Heat oil in a deep pan to 170C. Fry potato chips in batches until golden and crispy. Drain on paper towels.', 1200, 'Deep fry', 'Double frying makes crispier chips — fry once at lower heat, rest, then fry again at higher heat.'),
  (rid, 2, 'Prepare Egg Mix', 'Beat eggs with salt, pepper, diced onion, tomato, and chili.', NULL, NULL, NULL),
  (rid, 3, 'Combine', 'Place fried chips in a hot oiled skillet. Pour beaten egg mixture over the chips, making sure eggs fill all the gaps.', NULL, NULL, 'Press chips down so they are fully coated in egg.'),
  (rid, 4, 'Cook Omelette', 'Cook on medium heat until the bottom is golden and set. Carefully flip using a plate and cook the other side until golden.', 360, 'Cook both sides', 'Use a plate larger than the pan to flip — slide omelette onto plate, then invert back into pan.'),
  (rid, 5, 'Serve', 'Slide onto a plate and cut into wedges. Serve hot with ketchup and pili pili sauce on the side.', NULL, NULL, 'Best eaten immediately while chips are still crispy inside the omelette.');
END $$;

-- =========================
-- UGANDA (UG) - 3 recipes
-- =========================

-- 10. Luwombo
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'luwombo', 'Luwombo', 'Oluwombo',
    'A royal Ugandan dish of chicken, beef, or groundnut sauce steamed in banana leaves, locking in extraordinary flavor.',
    'UG', 'Uganda', 'East Africa', 'stew',
    ARRAY['banana-leaf','steamed','royal','traditional'],
    ARRAY['gluten-free','dairy-free','halal'],
    30, 120, 'hard', 6,
    'Luwombo was created in 1887 by the personal chef of Kabaka Mwanga II, the king of Buganda. It remains the most prestigious dish in Ugandan cuisine, served at weddings, coronations, and important gatherings. The banana leaf wrapping steams the ingredients to incredible tenderness while infusing a subtle earthy aroma.',
    420, 34, 12, 26, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 1, 'kg', 'chicken pieces', 'bone-in, skin removed', false, 'beef chunks'),
  (rid, 2, 'Main', 4, 'whole', 'banana leaves', 'softened over flame', false, 'aluminum foil'),
  (rid, 3, 'Sauce', 1, 'cup', 'ground peanuts', 'finely ground', false, NULL),
  (rid, 4, 'Sauce', 2, 'whole', 'onions', 'chopped', false, NULL),
  (rid, 5, 'Sauce', 3, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 6, 'Sauce', 2, 'whole', 'bell peppers', 'diced', false, NULL),
  (rid, 7, 'Sauce', 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 8, 'Sauce', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 9, 'Sauce', 1, 'cup', 'mushrooms', 'sliced', true, NULL),
  (rid, 10, 'Sauce', 1.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 11, 'Sauce', 0.5, 'tsp', 'black pepper', NULL, false, NULL),
  (rid, 12, 'Sauce', 1, 'cup', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare Banana Leaves', 'Pass banana leaves briefly over an open flame to soften them and prevent tearing. Wipe clean with a damp cloth.', NULL, NULL, 'The leaves should become pliable and darker green — do not char them.'),
  (rid, 2, 'Mix Filling', 'In a large bowl, combine chicken, ground peanuts, onions, tomatoes, bell peppers, garlic, ginger, mushrooms, salt, pepper, and water. Mix thoroughly.', NULL, NULL, 'Mixing the ground peanuts into the raw sauce ensures they cook into a rich, thick gravy.'),
  (rid, 3, 'Wrap Parcels', 'Place a portion of the mixture onto each banana leaf. Fold the leaf into a secure parcel, tying with banana fiber or kitchen string.', NULL, NULL, 'Ensure parcels are tightly sealed so steam cannot escape during cooking.'),
  (rid, 4, 'Steam', 'Place parcels in a large steamer or pot with a raised rack and water in the bottom. Cover tightly and steam over medium heat until chicken is very tender.', 3600, 'Steam', NULL),
  (rid, 5, 'Check Doneness', 'Carefully open one parcel to check that chicken is cooked through and sauce is thick. If needed, reseal and steam longer.', NULL, NULL, NULL),
  (rid, 6, 'Serve', 'Place unopened parcels on plates — let guests unwrap their own. Serve with matooke (steamed green bananas) or posho.', NULL, NULL, 'The aroma when opening the parcel at the table is part of the experience.');
END $$;

-- 11. Rolex
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'rolex-uganda', 'Rolex', 'Rolex',
    'Uganda''s famous street food — a chapati rolled around an egg omelette with fresh vegetables, eaten on the go.',
    'UG', 'Uganda', 'East Africa', 'snack',
    ARRAY['street-food','quick','rolled','popular'],
    ARRAY['nut-free','halal','vegetarian'],
    10, 15, 'easy', 2,
    'The Rolex is Uganda''s most beloved street food, found on virtually every street corner in Kampala. The name is a playful contraction of "rolled eggs." Born from the creativity of street vendors, this simple wrap has become a national icon and was even considered for UNESCO cultural heritage recognition.',
    420, 15, 38, 24, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Chapati', 2, 'cups', 'all-purpose flour', NULL, false, NULL),
  (rid, 2, 'Chapati', 0.75, 'cup', 'warm water', NULL, false, NULL),
  (rid, 3, 'Chapati', 2, 'tbsp', 'vegetable oil', 'plus more for frying', false, NULL),
  (rid, 4, 'Chapati', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 5, 'Omelette', 4, 'whole', 'eggs', 'beaten', false, NULL),
  (rid, 6, 'Omelette', 1, 'whole', 'onion', 'sliced', false, NULL),
  (rid, 7, 'Omelette', 1, 'whole', 'tomato', 'sliced', false, NULL),
  (rid, 8, 'Omelette', 0.5, 'cup', 'cabbage', 'shredded', false, NULL),
  (rid, 9, 'Omelette', 1, 'whole', 'green pepper', 'sliced', true, NULL),
  (rid, 10, 'Omelette', 0.5, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make Dough', 'Mix flour, salt, oil, and warm water into a soft dough. Knead for 5 minutes until smooth. Rest 15 minutes covered.', NULL, NULL, NULL),
  (rid, 2, 'Roll and Fry Chapati', 'Divide dough into 2 balls. Roll each into a thin circle. Fry in an oiled pan until golden on both sides. Set aside.', 300, 'Fry chapati', 'A good chapati should be flaky — brush with oil between layers as you cook.'),
  (rid, 3, 'Make Omelette', 'Beat eggs with salt. Pour into a hot oiled pan, adding onions, tomato, cabbage, and pepper on top. Cook until just set.', 180, 'Cook omelette', NULL),
  (rid, 4, 'Roll', 'Place the omelette on top of a chapati. Roll tightly into a cylinder, tucking the edges in.', NULL, NULL, 'Roll while the omelette is still warm so it molds to the chapati.'),
  (rid, 5, 'Serve', 'Wrap the bottom half in paper or foil for easy handling. Serve immediately while hot.', NULL, NULL, 'A true Kampala Rolex is eaten standing at the street vendor''s stall.');
END $$;

-- 12. Matoke
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'matoke', 'Matoke', 'Matooke',
    'Steamed and mashed green bananas cooked in a savory sauce — Uganda''s national dish and daily staple.',
    'UG', 'Uganda', 'East Africa', 'main',
    ARRAY['banana','staple','steamed','national-dish'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    20, 45, 'easy', 4,
    'Matooke is the soul food of the Baganda people and the undisputed national dish of Uganda. Green cooking bananas are steamed in their own leaves until soft, then mashed to a smooth golden paste. In Buganda culture, a meal without matooke is not a real meal, and a woman''s cooking skills are often judged by the quality of her matooke.',
    280, 3, 68, 1, 5, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Matoke', 8, 'whole', 'green bananas', 'peeled', false, 'green plantains'),
  (rid, 2, 'Matoke', 2, 'whole', 'banana leaves', 'for wrapping', false, 'aluminum foil'),
  (rid, 3, 'Sauce', 2, 'whole', 'onions', 'chopped', false, NULL),
  (rid, 4, 'Sauce', 3, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 5, 'Sauce', 2, 'whole', 'bell peppers', 'diced', false, NULL),
  (rid, 6, 'Sauce', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 7, 'Sauce', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 8, 'Sauce', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 9, 'Sauce', 0.5, 'tsp', 'curry powder', NULL, true, NULL),
  (rid, 10, 'Sauce', 1, 'cup', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare Bananas', 'Peel green bananas and place in a pot lined with banana leaves. The sap can stain, so oil your hands before peeling.', NULL, NULL, 'Rub cooking oil on your hands before peeling to prevent the sticky sap from staining.'),
  (rid, 2, 'Make Sauce', 'Heat oil in a pan. Saute onions until soft, add garlic, tomatoes, bell peppers, and curry powder. Cook until tomatoes break down into a sauce.', 600, 'Cook sauce', NULL),
  (rid, 3, 'Combine and Steam', 'Pour the sauce over the bananas. Add water. Wrap banana leaves over the top to seal. Cover pot with a tight lid and steam over low heat.', 2700, 'Steam', 'The banana leaves create a steam chamber that gives matooke its distinctive flavor.'),
  (rid, 4, 'Mash', 'Once bananas are completely soft, mash them in the pot using a wooden spoon, mixing with the sauce until smooth and golden.', NULL, NULL, NULL),
  (rid, 5, 'Serve', 'Mound the matooke on a platter, still in its banana leaf. Serve with groundnut sauce, beans, or meat stew.', NULL, NULL, 'Matooke should be smooth and lump-free — keep mashing until it reaches a uniform consistency.');
END $$;

-- =========================
-- RWANDA (RW) - 3 recipes
-- =========================

-- 13. Isombe
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'isombe', 'Isombe', 'Isombe',
    'Rwandan cassava leaf stew pounded smooth and simmered with palm oil, eggplant, and spinach.',
    'RW', 'Rwanda', 'East Africa', 'stew',
    ARRAY['cassava-leaves','traditional','everyday'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    30, 60, 'medium', 4,
    'Isombe is one of Rwanda''s most cherished dishes, made from pounded cassava leaves simmered until silky smooth. It is a staple across all regions and a source of deep nutritional value. Rwandan grandmothers say the secret is in the pounding — the leaves must be ground to a fine paste for the best texture.',
    220, 8, 18, 14, 6, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 500, 'g', 'cassava leaves', 'pounded to a paste', false, 'spinach and kale mix'),
  (rid, 2, 'Main', 1, 'whole', 'eggplant', 'diced', false, NULL),
  (rid, 3, 'Main', 2, 'cups', 'spinach', 'chopped', false, NULL),
  (rid, 4, 'Main', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 5, 'Main', 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, 'Main', 3, 'tbsp', 'palm oil', NULL, false, 'red palm oil'),
  (rid, 7, 'Main', 1, 'cup', 'water', NULL, false, NULL),
  (rid, 8, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 9, 'Main', 0.5, 'tsp', 'black pepper', NULL, false, NULL),
  (rid, 10, 'Main', 1, 'whole', 'scotch bonnet pepper', 'whole', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare Leaves', 'If using fresh cassava leaves, pound them in a mortar until they form a fine green paste. If using frozen pre-pounded leaves, thaw completely.', NULL, NULL, 'Cassava leaves must be cooked thoroughly — never eat them raw as they contain naturally occurring compounds that break down with heat.'),
  (rid, 2, 'Saute Base', 'Heat palm oil in a heavy pot. Saute onions and garlic until soft and fragrant.', 480, 'Saute', NULL),
  (rid, 3, 'Add Vegetables', 'Add the eggplant and cook until softened. Add the pounded cassava leaves and water. Stir well to combine.', 600, 'Cook eggplant', NULL),
  (rid, 4, 'Simmer', 'Bring to a boil, then reduce heat. Add scotch bonnet whole (for mild heat). Simmer, stirring occasionally, until leaves are very tender and sauce is thick.', 2400, 'Simmer', 'The longer you simmer, the smoother and more flavorful the isombe becomes.'),
  (rid, 5, 'Add Spinach', 'Stir in chopped spinach and cook for 5 more minutes until wilted. Season with salt and pepper.', 300, 'Wilt spinach', NULL),
  (rid, 6, 'Serve', 'Remove the whole scotch bonnet. Serve isombe with boiled plantains, rice, or ubugari (maize porridge).', NULL, NULL, 'Isombe tastes even better the next day after the flavors have melded.');
END $$;

-- 14. Brochettes
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'rwandan-brochettes', 'Rwandan Brochettes', 'Brochettes',
    'Charcoal-grilled goat meat skewers marinated with garlic and served with fried plantains — Rwanda''s favorite barbecue.',
    'RW', 'Rwanda', 'East Africa', 'main',
    ARRAY['grilled','skewers','goat','street-food'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    30, 30, 'easy', 4,
    'Brochettes are the social food of Rwanda, found at every bar, restaurant, and street corner in Kigali. Goat is the most traditional and popular meat, skewered and grilled over charcoal while friends share Primus beers. The simplicity of the seasoning lets the quality of the meat speak for itself.',
    380, 36, 8, 22, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Meat', 1, 'kg', 'goat meat', 'cut into 1-inch cubes', false, 'beef'),
  (rid, 2, 'Marinade', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 3, 'Marinade', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 4, 'Marinade', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 5, 'Marinade', 1, 'whole', 'lemon', 'juiced', false, NULL),
  (rid, 6, 'Marinade', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 7, 'Marinade', 0.5, 'tsp', 'black pepper', NULL, false, NULL),
  (rid, 8, 'Marinade', 0.5, 'tsp', 'cumin', 'ground', false, NULL),
  (rid, 9, 'Side', 4, 'whole', 'plantains', 'ripe, sliced', false, NULL),
  (rid, 10, 'Side', 2, 'tbsp', 'vegetable oil', 'for frying', false, NULL),
  (rid, 11, 'Sauce', 2, 'whole', 'tomatoes', 'diced', false, NULL),
  (rid, 12, 'Sauce', 1, 'whole', 'onion', 'diced', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Marinate Meat', 'Combine garlic, ginger, oil, lemon juice, salt, pepper, and cumin. Toss goat cubes in marinade. Refrigerate for at least 1 hour.', NULL, NULL, 'Goat benefits from longer marination — overnight gives the best flavor.'),
  (rid, 2, 'Skewer', 'Thread marinated meat onto metal or soaked wooden skewers, leaving small gaps between pieces for even cooking.', NULL, NULL, NULL),
  (rid, 3, 'Grill', 'Grill skewers over hot charcoal, turning every 3-4 minutes, until charred on the outside and cooked through.', 1200, 'Grill', 'Keep a spray bottle of water nearby to control flare-ups from dripping fat.'),
  (rid, 4, 'Fry Plantains', 'While meat grills, slice plantains and fry in oil until golden on both sides. Drain on paper towels.', 600, 'Fry plantains', NULL),
  (rid, 5, 'Make Fresh Sauce', 'Mix diced tomatoes and onions with a pinch of salt and squeeze of lemon for a simple fresh condiment.', NULL, NULL, NULL),
  (rid, 6, 'Serve', 'Arrange skewers on a platter with fried plantains and fresh tomato-onion sauce. Serve hot off the grill.', NULL, NULL, 'In Kigali, brochettes are always served with toothpicks and cold beer.');
END $$;

-- 15. Igisafuria
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'igisafuria', 'Igisafuria', 'Igisafuria',
    'A hearty Rwandan one-pot stew of plantains, vegetables, and meat simmered until everything melds together.',
    'RW', 'Rwanda', 'East Africa', 'stew',
    ARRAY['one-pot','plantain','hearty','comfort-food'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    20, 50, 'easy', 6,
    'Igisafuria literally means "the pot" in Kinyarwanda, reflecting its one-pot cooking method. This practical and nourishing dish was born from the Rwandan tradition of combining whatever ingredients are available into a single pot. Every family has their own version, making it both a unifying and deeply personal dish.',
    360, 20, 42, 12, 5, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 4, 'whole', 'green plantains', 'peeled, chunked', false, NULL),
  (rid, 2, 'Main', 400, 'g', 'beef', 'cubed', false, 'goat'),
  (rid, 3, 'Main', 2, 'whole', 'carrots', 'sliced', false, NULL),
  (rid, 4, 'Main', 2, 'whole', 'potatoes', 'cubed', false, NULL),
  (rid, 5, 'Main', 1, 'cup', 'green beans', 'trimmed', false, NULL),
  (rid, 6, 'Main', 2, 'whole', 'onions', 'chopped', false, NULL),
  (rid, 7, 'Main', 3, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 8, 'Main', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 9, 'Main', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 10, 'Main', 2, 'cups', 'water', NULL, false, NULL),
  (rid, 11, 'Main', 1.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 12, 'Main', 1, 'whole', 'scotch bonnet', 'whole', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown Meat', 'Heat oil in a large pot. Season beef with salt and sear until browned on all sides.', 600, 'Sear', NULL),
  (rid, 2, 'Build Stew', 'Add onions and garlic, cook until softened. Add tomatoes and cook until they break down into a sauce.', 480, 'Saute', NULL),
  (rid, 3, 'Add Vegetables', 'Add plantains, potatoes, carrots, green beans, and water. Drop in the whole scotch bonnet. Bring to a boil.', NULL, NULL, 'Keep the scotch bonnet whole for gentle heat — piercing it will make the stew very spicy.'),
  (rid, 4, 'Simmer', 'Reduce heat, cover, and simmer until all vegetables are tender and the stew has thickened naturally from the plantains breaking down.', 2400, 'Simmer', 'The plantains will partially dissolve and thicken the stew — this is desired.'),
  (rid, 5, 'Season and Serve', 'Remove scotch bonnet. Adjust salt to taste. Serve hot in deep bowls — this is a complete meal in itself.', NULL, NULL, 'Igisafuria improves with reheating the next day as flavors deepen overnight.');
END $$;

-- =========================
-- MOZAMBIQUE (MZ) - 3 recipes
-- =========================

-- 16. Piri Piri Chicken
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'piri-piri-chicken', 'Piri Piri Chicken', 'Galinha à Zambeziana',
    'Mozambique''s fiery grilled chicken marinated in piri piri chili sauce with citrus, garlic, and paprika.',
    'MZ', 'Mozambique', 'East Africa', 'main',
    ARRAY['grilled','spicy','iconic','chili'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    30, 45, 'medium', 4,
    'Piri piri chicken is Mozambique''s gift to the world, born from the marriage of African bird''s eye chilies and Portuguese colonial cooking techniques. The small but fiery piri piri pepper is native to Mozambique, and local cooks have perfected the art of balancing its heat with citrus and garlic into a marinade that has become globally famous.',
    380, 38, 4, 22, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Chicken', 1.5, 'kg', 'whole chicken', 'spatchcocked', false, NULL),
  (rid, 2, 'Marinade', 10, 'whole', 'piri piri chilies', 'stems removed', false, 'bird''s eye chilies'),
  (rid, 3, 'Marinade', 6, 'cloves', 'garlic', NULL, false, NULL),
  (rid, 4, 'Marinade', 2, 'whole', 'lemons', 'juiced', false, NULL),
  (rid, 5, 'Marinade', 1, 'tbsp', 'paprika', 'smoked', false, NULL),
  (rid, 6, 'Marinade', 1, 'tsp', 'oregano', 'dried', false, NULL),
  (rid, 7, 'Marinade', 0.5, 'cup', 'olive oil', NULL, false, NULL),
  (rid, 8, 'Marinade', 2, 'tbsp', 'red wine vinegar', NULL, false, NULL),
  (rid, 9, 'Marinade', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 10, 'Marinade', 1, 'whole', 'red bell pepper', 'roasted', false, NULL),
  (rid, 11, 'Serving', 2, 'whole', 'limes', 'halved', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make Piri Piri Sauce', 'Blend piri piri chilies, garlic, lemon juice, roasted pepper, paprika, oregano, vinegar, oil, and salt into a smooth sauce.', NULL, NULL, 'Wear gloves when handling piri piri chilies — they are extremely hot.'),
  (rid, 2, 'Marinate Chicken', 'Score the chicken deeply on both sides. Rub two-thirds of the sauce all over and under the skin. Reserve remaining sauce. Marinate at least 4 hours or overnight.', NULL, NULL, 'Deep scores let the marinade penetrate — the longer the marination, the more flavorful.'),
  (rid, 3, 'Grill Chicken', 'Grill chicken over medium-hot charcoal, skin side down first, basting with reserved sauce every 10 minutes. Turn occasionally.', 2700, 'Grill', 'Start skin side down to render fat and get crispy skin.'),
  (rid, 4, 'Check Doneness', 'Chicken is done when juices run clear when pierced at the thigh and internal temperature reaches 75C. Rest for 10 minutes.', 600, 'Rest', NULL),
  (rid, 5, 'Serve', 'Cut into pieces and squeeze fresh lime over the top. Serve with rice, fries, or matapa on the side.', NULL, NULL, 'Serve extra piri piri sauce on the side for those who like more heat.');
END $$;

-- 17. Matapa
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'matapa', 'Matapa', 'Matapa',
    'Creamy Mozambican stew of cassava leaves pounded with ground peanuts, coconut milk, and garlic.',
    'MZ', 'Mozambique', 'East Africa', 'stew',
    ARRAY['cassava-leaves','peanut','coconut','traditional'],
    ARRAY['vegan','gluten-free','dairy-free','halal'],
    25, 45, 'medium', 4,
    'Matapa is a cornerstone of Mozambican cuisine from the southern provinces. Made from young cassava leaves pounded with ground peanuts and simmered in coconut milk, it represents the ingenious use of local ingredients. Traditionally served with rice and shrimp, it is a dish that connects Mozambicans to their agricultural roots.',
    340, 12, 22, 24, 5, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 500, 'g', 'cassava leaves', 'pounded or frozen', false, 'spinach'),
  (rid, 2, 'Main', 1, 'cup', 'raw peanuts', 'ground to powder', false, NULL),
  (rid, 3, 'Main', 400, 'ml', 'coconut milk', NULL, false, NULL),
  (rid, 4, 'Main', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, 'Main', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 6, 'Main', 2, 'tbsp', 'olive oil', NULL, false, NULL),
  (rid, 7, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 8, 'Main', 1, 'cup', 'water', NULL, false, NULL),
  (rid, 9, 'Optional', 200, 'g', 'shrimp', 'peeled', true, NULL),
  (rid, 10, 'Optional', 1, 'whole', 'lemon', 'juiced', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook Leaves', 'Boil cassava leaves in water for 20 minutes until tender. Drain well.', 1200, 'Boil leaves', 'Cassava leaves require thorough cooking — boiling removes natural compounds and makes them safe and delicious.'),
  (rid, 2, 'Saute Aromatics', 'Heat olive oil in a pot. Saute onion and garlic until soft and golden.', 480, 'Saute', NULL),
  (rid, 3, 'Combine', 'Add cooked cassava leaves, ground peanuts, and water. Stir well to combine. Simmer for 10 minutes.', 600, 'Simmer', NULL),
  (rid, 4, 'Add Coconut Milk', 'Pour in coconut milk and stir until the stew is creamy and thick. If adding shrimp, add them now and cook until pink.', 900, 'Simmer with coconut', 'Stir frequently to prevent the peanut mixture from sticking to the bottom.'),
  (rid, 5, 'Serve', 'Season with salt and lemon juice. Serve matapa over steamed white rice.', NULL, NULL, 'Matapa pairs beautifully with grilled prawns for a Mozambican feast.');
END $$;

-- 18. Caril de Camarao
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'caril-de-camarao', 'Caril de Camarao', 'Caril de Camarão',
    'Mozambican prawn curry simmered in coconut milk with tomatoes and warm spices — a coastal treasure.',
    'MZ', 'Mozambique', 'East Africa', 'main',
    ARRAY['seafood','curry','coconut','coastal'],
    ARRAY['gluten-free','dairy-free','nut-free','halal','pescatarian'],
    20, 30, 'easy', 4,
    'Caril de Camarao reflects Mozambique''s position at the crossroads of African, Portuguese, and Indian Ocean culinary traditions. The warm waters of the Mozambique Channel yield some of the world''s finest prawns, and local cooks honor them with this lightly spiced coconut curry that lets the sweetness of the seafood shine through.',
    320, 28, 12, 18, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Prawns', 800, 'g', 'large prawns', 'peeled, deveined', false, NULL),
  (rid, 2, 'Curry', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 3, 'Curry', 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 4, 'Curry', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 5, 'Curry', 3, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 6, 'Curry', 400, 'ml', 'coconut milk', NULL, false, NULL),
  (rid, 7, 'Curry', 1, 'tbsp', 'curry powder', NULL, false, NULL),
  (rid, 8, 'Curry', 0.5, 'tsp', 'turmeric', NULL, false, NULL),
  (rid, 9, 'Curry', 1, 'whole', 'red chili', 'sliced', true, NULL),
  (rid, 10, 'Curry', 2, 'tbsp', 'olive oil', NULL, false, NULL),
  (rid, 11, 'Curry', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 12, 'Garnish', 0.25, 'cup', 'fresh cilantro', 'chopped', false, NULL),
  (rid, 13, 'Garnish', 1, 'whole', 'lime', 'wedged', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Saute Aromatics', 'Heat olive oil in a wide pan. Saute onion, garlic, and ginger until soft and fragrant.', 480, 'Saute', NULL),
  (rid, 2, 'Build Sauce', 'Add curry powder, turmeric, and chili. Stir for 30 seconds. Add chopped tomatoes and cook until they break down into a sauce.', 600, 'Cook tomatoes', 'Toast the spices briefly before adding tomatoes to deepen their flavor.'),
  (rid, 3, 'Add Coconut Milk', 'Pour in coconut milk and stir well. Bring to a gentle simmer and cook for 5 minutes to meld flavors.', 300, 'Simmer', NULL),
  (rid, 4, 'Cook Prawns', 'Add prawns to the sauce in a single layer. Cook for 2-3 minutes per side until pink and curled. Do not overcook.', 360, 'Cook prawns', 'Prawns cook quickly — remove from heat as soon as they turn pink to keep them tender.'),
  (rid, 5, 'Serve', 'Garnish with fresh cilantro and lime wedges. Serve over steamed rice or with crusty bread to soak up the sauce.', NULL, NULL, 'This curry is best served immediately — prawns toughen if left sitting in hot sauce.');
END $$;

-- =========================
-- MADAGASCAR (MG) - 3 recipes
-- =========================

-- 19. Romazava
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'romazava', 'Romazava', 'Romazava',
    'Madagascar''s national dish — a fragrant beef and mixed greens stew flavored with tomatoes, onions, and ginger.',
    'MG', 'Madagascar', 'East Africa', 'stew',
    ARRAY['national-dish','greens','beef','everyday'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    20, 45, 'easy', 4,
    'Romazava is the national dish of Madagascar, eaten daily across the island. Its name means "clear broth" in Malagasy, referring to the light yet flavorful soup base. The combination of mixed greens (called bredes) with beef creates a nourishing everyday meal that reflects the island''s unique blend of Southeast Asian and African culinary heritage.',
    310, 28, 10, 18, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 500, 'g', 'beef chuck', 'cubed', false, 'zebu meat'),
  (rid, 2, 'Main', 2, 'cups', 'mustard greens', 'chopped', false, NULL),
  (rid, 3, 'Main', 2, 'cups', 'spinach', 'chopped', false, NULL),
  (rid, 4, 'Main', 1, 'cup', 'watercress', 'chopped', false, 'arugula'),
  (rid, 5, 'Main', 2, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 6, 'Main', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 7, 'Main', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 8, 'Main', 1, 'inch', 'ginger', 'sliced', false, NULL),
  (rid, 9, 'Main', 3, 'cups', 'water', NULL, false, NULL),
  (rid, 10, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 11, 'Main', 1, 'tbsp', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown Beef', 'Heat oil in a pot. Brown beef cubes on all sides over high heat.', 600, 'Sear', NULL),
  (rid, 2, 'Saute Aromatics', 'Add onion, garlic, and ginger. Cook until softened. Add tomatoes and cook until they break down.', 480, 'Saute', NULL),
  (rid, 3, 'Simmer Broth', 'Add water and bring to a boil. Reduce heat and simmer until beef is tender.', 1800, 'Simmer', 'The broth should remain relatively clear — this is a light stew, not a thick one.'),
  (rid, 4, 'Add Greens', 'Add mustard greens first and cook 5 minutes. Then add spinach and watercress. Cook until all greens are wilted.', 480, 'Cook greens', 'Add hardier greens first, delicate ones last, so nothing is overcooked.'),
  (rid, 5, 'Serve', 'Season with salt. Ladle into bowls over steamed white rice. Serve with rougail (tomato chili condiment) on the side.', NULL, NULL, 'In Madagascar, romazava is always served with vary (rice) — the rice is the main event, the stew is the accompaniment.');
END $$;

-- 20. Ravitoto
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'ravitoto', 'Ravitoto', 'Ravitoto',
    'Pounded cassava leaves braised with pork and coconut milk — a rich, earthy Malagasy classic.',
    'MG', 'Madagascar', 'East Africa', 'stew',
    ARRAY['cassava-leaves','pork','coconut','traditional'],
    ARRAY['gluten-free','dairy-free'],
    30, 60, 'medium', 4,
    'Ravitoto is a beloved Malagasy comfort dish made from pounded cassava leaves slow-cooked with fatty pork. The dish showcases the Malagasy genius for transforming humble ingredients into something deeply satisfying. It is often prepared for Sunday family gatherings and is considered one of the island''s most traditional recipes.',
    420, 24, 16, 30, 5, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 500, 'g', 'cassava leaves', 'pounded fine', false, 'frozen cassava leaves'),
  (rid, 2, 'Main', 500, 'g', 'pork belly', 'cubed', false, 'pork shoulder'),
  (rid, 3, 'Main', 200, 'ml', 'coconut milk', NULL, false, NULL),
  (rid, 4, 'Main', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 5, 'Main', 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, 'Main', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 7, 'Main', 2, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 8, 'Main', 1, 'cup', 'water', NULL, false, NULL),
  (rid, 9, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 10, 'Main', 1, 'tbsp', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown Pork', 'Heat oil in a heavy pot. Brown pork belly pieces until golden and fat begins to render.', 600, 'Brown pork', 'Rendering the pork fat first creates a flavorful base for the entire dish.'),
  (rid, 2, 'Cook Aromatics', 'Add onion, garlic, and ginger. Saute until softened. Add tomatoes and cook until broken down.', 480, 'Saute', NULL),
  (rid, 3, 'Add Cassava Leaves', 'Add pounded cassava leaves and water. Stir well to combine with the pork and aromatics.', NULL, NULL, NULL),
  (rid, 4, 'Braise', 'Bring to a boil, then reduce heat. Cover and simmer, stirring occasionally, until leaves are very tender and pork is falling apart.', 2400, 'Braise', 'Long, slow cooking is essential — cassava leaves need extended heat to become tender and safe to eat.'),
  (rid, 5, 'Finish with Coconut', 'Stir in coconut milk and cook uncovered for 10 more minutes until sauce thickens.', 600, 'Finish', NULL),
  (rid, 6, 'Serve', 'Season with salt. Serve hot over a generous mound of steamed white rice.', NULL, NULL, 'Ravitoto gets better as it sits — leftovers are even more flavorful the next day.');
END $$;

-- 21. Mofo Gasy
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'mofo-gasy', 'Mofo Gasy', 'Mofo Gasy',
    'Traditional Malagasy rice flour pancakes cooked in special molds — crispy outside, soft inside, perfect for breakfast.',
    'MG', 'Madagascar', 'East Africa', 'breakfast',
    ARRAY['pancake','rice-flour','street-food','morning'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free'],
    15, 20, 'easy', 8,
    'Mofo Gasy, meaning "Malagasy bread," is the quintessential Malagasy breakfast sold by street vendors every morning across the island. Cooked in special cast-iron molds called mofo gasy molds, these rice flour cakes have a distinctive crispy exterior and soft, slightly sweet interior. The sound of vendors calling "mofo gasy" is the alarm clock of Antananarivo.',
    160, 3, 32, 2, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Batter', 2, 'cups', 'rice flour', NULL, false, NULL),
  (rid, 2, 'Batter', 1, 'cup', 'coconut milk', NULL, false, 'water'),
  (rid, 3, 'Batter', 0.5, 'cup', 'water', 'lukewarm', false, NULL),
  (rid, 4, 'Batter', 2, 'tbsp', 'sugar', NULL, false, NULL),
  (rid, 5, 'Batter', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 6, 'Batter', 1, 'tsp', 'instant yeast', NULL, false, NULL),
  (rid, 7, 'Batter', 1, 'tbsp', 'vanilla extract', NULL, true, NULL),
  (rid, 8, 'Cooking', 2, 'tbsp', 'vegetable oil', 'for greasing', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make Batter', 'Dissolve yeast and sugar in lukewarm water. Let stand 5 minutes until foamy. Mix rice flour, coconut milk, salt, vanilla, and yeast mixture into a smooth batter.', 300, 'Activate yeast', NULL),
  (rid, 2, 'Ferment', 'Cover batter and let rest in a warm place for 1 hour until bubbly and slightly risen.', 3600, 'Ferment', 'The fermentation gives mofo gasy its characteristic light tang.'),
  (rid, 3, 'Heat Molds', 'Heat a mofo gasy mold, aebleskiver pan, or mini muffin tin over medium heat. Brush each well generously with oil.', NULL, NULL, 'An aebleskiver pan is the closest substitute for a traditional mofo gasy mold.'),
  (rid, 4, 'Cook Pancakes', 'Fill each mold three-quarters full with batter. Cover and cook until bottoms are golden and tops are set.', 480, 'Cook', 'Listen for a sizzle — if the oil is not hot enough, the mofo gasy will stick.'),
  (rid, 5, 'Serve', 'Turn out onto a plate. Serve warm with coffee or tea for a traditional Malagasy breakfast.', NULL, NULL, 'Best eaten fresh and warm — mofo gasy lose their crispness as they cool.');
END $$;

-- =========================
-- ZAMBIA (ZM) - 3 recipes
-- =========================

-- 22. Nshima with Ifisashi
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'nshima-ifisashi', 'Nshima with Ifisashi', 'Nshima ne Ifisashi',
    'Zambia''s staple maize porridge served with a rich peanut and greens sauce — hearty, creamy, and satisfying.',
    'ZM', 'Zambia', 'East Africa', 'main',
    ARRAY['staple','peanut','greens','everyday'],
    ARRAY['vegan','gluten-free','dairy-free','halal'],
    15, 35, 'easy', 4,
    'Nshima is the cornerstone of Zambian cuisine — no meal is complete without it. Ifisashi, a peanut-based vegetable relish, is one of the most popular accompaniments. The combination provides a complete protein and is eaten daily in homes across the country. Zambians say you have not eaten until you have eaten nshima.',
    380, 14, 52, 15, 6, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Nshima', 2, 'cups', 'white maize meal', 'fine', false, NULL),
  (rid, 2, 'Nshima', 4, 'cups', 'water', NULL, false, NULL),
  (rid, 3, 'Ifisashi', 1, 'bunch', 'rape leaves', 'chopped', false, 'kale or collards'),
  (rid, 4, 'Ifisashi', 0.5, 'cup', 'peanut butter', 'natural, unsweetened', false, 'ground peanuts'),
  (rid, 5, 'Ifisashi', 2, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 6, 'Ifisashi', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 7, 'Ifisashi', 1, 'cup', 'water', NULL, false, NULL),
  (rid, 8, 'Ifisashi', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 9, 'Ifisashi', 0.5, 'tsp', 'baking soda', 'keeps greens bright', true, NULL),
  (rid, 10, 'Ifisashi', 1, 'tbsp', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook Greens', 'Boil rape leaves in salted water with a pinch of baking soda until tender. Drain and set aside.', 600, 'Boil greens', NULL),
  (rid, 2, 'Make Ifisashi Sauce', 'Heat oil in a pot. Saute onion until soft. Add tomatoes and cook until broken down. Stir in peanut butter and water. Simmer until thick and creamy.', 900, 'Simmer sauce', 'Stir constantly when adding peanut butter to prevent lumps and sticking.'),
  (rid, 3, 'Combine', 'Add cooked greens to the peanut sauce. Stir well and simmer together for 5 minutes.', 300, 'Combine', NULL),
  (rid, 4, 'Make Nshima', 'Bring 4 cups water to a boil. Add a third of the maize meal, stirring to make a thin porridge. Cook 5 minutes, then gradually add remaining meal, stirring vigorously until very thick and pulling from pot sides.', 900, 'Cook nshima', 'A proper nshima should be firm enough to shape with a wet spoon.'),
  (rid, 5, 'Serve', 'Scoop nshima into a wet bowl and turn onto a plate in a smooth dome. Serve ifisashi alongside. Eat by pinching nshima and dipping.', NULL, NULL, 'Zambians eat nshima with the right hand — roll a ball, press a dip in the center, and scoop the relish.');
END $$;

-- 23. Kapenta
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kapenta', 'Kapenta', 'Kapenta',
    'Tiny dried sardines fried with tomatoes and onions — a protein-packed Zambian staple from Lake Kariba.',
    'ZM', 'Zambia', 'East Africa', 'side',
    ARRAY['fish','dried','protein','lake-kariba'],
    ARRAY['gluten-free','dairy-free','nut-free','halal','pescatarian'],
    10, 20, 'easy', 4,
    'Kapenta are tiny freshwater sardines from Lake Kariba and Lake Tanganyika that have become one of Zambia''s most important protein sources. Sun-dried and sold in markets across the country, these little fish are an affordable nutritional powerhouse. The fishing boats that catch kapenta at night using bright lights are a magical sight on the lake.',
    220, 22, 8, 12, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 2, 'cups', 'dried kapenta', 'rinsed', false, 'dried anchovies'),
  (rid, 2, 'Main', 2, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 3, 'Main', 1, 'whole', 'onion', 'sliced', false, NULL),
  (rid, 4, 'Main', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, 'Main', 1, 'whole', 'green pepper', 'diced', false, NULL),
  (rid, 6, 'Main', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 7, 'Main', 0.5, 'tsp', 'curry powder', NULL, true, NULL),
  (rid, 8, 'Main', 0.5, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Rinse Kapenta', 'Rinse dried kapenta in cold water to remove excess salt and any grit. Drain well.', NULL, NULL, 'Some cooks soak kapenta for 10 minutes to reduce saltiness — taste first and decide.'),
  (rid, 2, 'Fry Kapenta', 'Heat oil in a pan over medium heat. Add kapenta and fry, stirring frequently, until lightly crispy.', 600, 'Fry', NULL),
  (rid, 3, 'Add Vegetables', 'Add onion, garlic, and green pepper. Saute until softened. Add tomatoes and curry powder.', 480, 'Saute', NULL),
  (rid, 4, 'Simmer', 'Cook until tomatoes break down and form a thick sauce coating the kapenta. Season with salt if needed.', 600, 'Simmer', 'Kapenta are already salty from drying — taste before adding extra salt.'),
  (rid, 5, 'Serve', 'Serve hot alongside nshima. Kapenta is also delicious with rice or as a snack on its own.', NULL, NULL, 'Kapenta are eaten whole — head, bones, and all — which makes them rich in calcium.');
END $$;

-- 24. Chikanda
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'chikanda', 'Chikanda', 'Chikanda',
    'Zambian "African polony" — a firm savory cake made from wild orchid tubers and ground peanuts, sliced and served cold.',
    'ZM', 'Zambia', 'East Africa', 'snack',
    ARRAY['unique','orchid','peanut','traditional'],
    ARRAY['vegan','gluten-free','dairy-free','halal'],
    30, 60, 'hard', 8,
    'Chikanda is one of Africa''s most unique foods, made from the tubers of wild terrestrial orchids (chikanda tubers) mixed with ground peanuts and chili. Often called "African polony" for its firm, sliceable texture, it is a beloved snack in Zambia. The orchid tubers give it a distinctive bouncy texture unlike any other food.',
    180, 8, 18, 10, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 1, 'cup', 'chikanda powder', 'ground orchid tubers', false, NULL),
  (rid, 2, 'Main', 1, 'cup', 'raw peanuts', 'ground fine', false, NULL),
  (rid, 3, 'Main', 2, 'cups', 'water', NULL, false, NULL),
  (rid, 4, 'Main', 1, 'tsp', 'baking soda', NULL, false, NULL),
  (rid, 5, 'Main', 1, 'tsp', 'chili flakes', NULL, false, NULL),
  (rid, 6, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 7, 'Main', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 8, 'Main', 1, 'whole', 'onion', 'grated', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare Mixture', 'Combine chikanda powder, ground peanuts, baking soda, chili flakes, salt, and grated onion in a bowl. Mix thoroughly.', NULL, NULL, 'The chikanda powder must be very finely ground for a smooth final texture.'),
  (rid, 2, 'Cook', 'Add water gradually while stirring to form a thick paste. Transfer to an oiled pot. Cook over medium-low heat, stirring constantly, until the mixture thickens and begins to pull away from the pot.', 1800, 'Cook', 'Stir constantly to prevent burning — the mixture thickens significantly as it cooks.'),
  (rid, 3, 'Set', 'Pour the cooked mixture into an oiled loaf pan or mold. Press down firmly to remove air pockets. Let cool completely at room temperature.', NULL, NULL, NULL),
  (rid, 4, 'Chill', 'Refrigerate for at least 2 hours until firm and set.', NULL, NULL, 'Chikanda firms up as it cools — it should slice cleanly like polony.'),
  (rid, 5, 'Serve', 'Turn out of the mold and slice into rounds or squares. Serve cold as a snack or appetizer.', NULL, NULL, 'Chikanda is traditionally sold sliced on the street — it is a grab-and-go Zambian snack.');
END $$;

-- =========================
-- ZIMBABWE (ZW) - 3 recipes
-- =========================

-- 25. Sadza with Muriwo
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'sadza-muriwo', 'Sadza with Muriwo', 'Sadza nemuriwo',
    'Zimbabwe''s national dish — thick maize porridge served with sauteed leafy greens in a tomato and onion base.',
    'ZW', 'Zimbabwe', 'East Africa', 'main',
    ARRAY['staple','national-dish','greens','everyday'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    15, 30, 'easy', 4,
    'Sadza is to Zimbabwe what rice is to Asia — the foundation of every meal. Made from finely ground white maize, it is eaten at least twice a day by most Zimbabweans. Muriwo (leafy greens) is the most common relish, and a meal of sadza nemuriwo connects every Zimbabwean to home, no matter where they are in the world.',
    300, 7, 56, 6, 5, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Sadza', 2, 'cups', 'white maize meal', 'fine', false, NULL),
  (rid, 2, 'Sadza', 4, 'cups', 'water', NULL, false, NULL),
  (rid, 3, 'Muriwo', 1, 'bunch', 'collard greens', 'shredded', false, 'spinach'),
  (rid, 4, 'Muriwo', 2, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 5, 'Muriwo', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 6, 'Muriwo', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 7, 'Muriwo', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 8, 'Muriwo', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 9, 'Muriwo', 0.5, 'cup', 'peanut butter', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Start Sadza', 'Bring 4 cups water to a boil. Mix a cup of maize meal with cold water to form a slurry. Pour into boiling water, stirring. Cook thin porridge for 5 minutes.', 300, 'Thin porridge', NULL),
  (rid, 2, 'Thicken Sadza', 'Gradually add remaining maize meal, stirring vigorously with a wooden spoon until very thick and smooth. Cook 5 more minutes.', 600, 'Thicken', 'The sadza is ready when it cleanly pulls away from the pot and holds its shape.'),
  (rid, 3, 'Cook Muriwo', 'Heat oil in a pan. Saute onion and garlic until soft. Add tomatoes and cook down. Add greens and cook until wilted and tender.', 600, 'Cook greens', 'For extra richness, stir a spoonful of peanut butter into the greens.'),
  (rid, 4, 'Shape Sadza', 'Wet a bowl, scoop sadza into it, and turn onto a plate to form a smooth dome.', NULL, NULL, NULL),
  (rid, 5, 'Serve', 'Place sadza dome on plate with muriwo alongside. Eat by pinching off pieces of sadza and scooping up the greens.', NULL, NULL, 'In Shona culture, washing hands before and after eating sadza is essential etiquette.');
END $$;

-- 26. Madora
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'madora', 'Madora', 'Madora',
    'Crispy fried mopane worms sauteed with tomatoes, onions, and peanuts — Zimbabwe''s protein-rich delicacy.',
    'ZW', 'Zimbabwe', 'East Africa', 'snack',
    ARRAY['insect','protein','traditional','indigenous'],
    ARRAY['gluten-free','dairy-free','halal'],
    15, 25, 'easy', 4,
    'Madora (mopane worms) are the caterpillars of the emperor moth, harvested from mopane trees in the bushveld. They are one of southern Africa''s most important indigenous food sources, packed with more protein than beef per gram. Once a rural subsistence food, madora are now a prized delicacy served even in upscale restaurants.',
    280, 32, 8, 14, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 2, 'cups', 'dried mopane worms', NULL, false, NULL),
  (rid, 2, 'Main', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 3, 'Main', 2, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 4, 'Main', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, 'Main', 1, 'whole', 'green chili', 'chopped', true, NULL),
  (rid, 6, 'Main', 0.25, 'cup', 'roasted peanuts', 'crushed', true, NULL),
  (rid, 7, 'Main', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 8, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 9, 'Main', 1, 'cup', 'water', 'for soaking', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Soak Madora', 'Soak dried mopane worms in warm water for 15 minutes until slightly softened. Drain and squeeze out excess water.', 900, 'Soak', 'Do not over-soak — they should be pliable but still have some chewiness.'),
  (rid, 2, 'Fry Madora', 'Heat oil in a pan. Fry the madora until crispy on the outside, stirring frequently.', 600, 'Fry', 'Fry in a single layer for maximum crispiness.'),
  (rid, 3, 'Add Vegetables', 'Add onion, garlic, and chili. Cook until softened. Add tomatoes and cook until they form a thick sauce.', 480, 'Saute', NULL),
  (rid, 4, 'Combine and Finish', 'Toss the fried madora in the tomato sauce. Add crushed peanuts. Cook 3 more minutes to meld flavors.', 180, 'Combine', 'The peanuts add a complementary crunch and nuttiness.'),
  (rid, 5, 'Serve', 'Serve hot alongside sadza as a protein-rich relish, or enjoy on their own as a snack.', NULL, NULL, 'Madora are a sustainable protein source — embrace this ancient food tradition.');
END $$;

-- 27. Dovi
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'dovi', 'Dovi', 'Dovi',
    'Zimbabwean peanut butter chicken stew — tender chicken simmered in a rich, creamy peanut and tomato sauce.',
    'ZW', 'Zimbabwe', 'East Africa', 'stew',
    ARRAY['peanut','chicken','comfort-food','popular'],
    ARRAY['gluten-free','dairy-free','halal'],
    15, 45, 'easy', 4,
    'Dovi is one of Zimbabwe''s most beloved stews, showcasing the country''s love affair with peanut butter (dovi literally means peanut butter in Shona). This creamy, rich stew is comfort food at its finest, served at family dinners across the country. The peanut sauce transforms simple chicken into something extraordinary.',
    440, 35, 14, 28, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 1, 'kg', 'chicken pieces', 'bone-in', false, NULL),
  (rid, 2, 'Main', 0.5, 'cup', 'peanut butter', 'natural', false, NULL),
  (rid, 3, 'Main', 3, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 4, 'Main', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 5, 'Main', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, 'Main', 1, 'cup', 'water', NULL, false, NULL),
  (rid, 7, 'Main', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 8, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 9, 'Main', 0.5, 'tsp', 'black pepper', NULL, false, NULL),
  (rid, 10, 'Main', 1, 'tsp', 'curry powder', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown Chicken', 'Heat oil in a pot. Season chicken with salt and pepper, then brown on all sides. Remove and set aside.', 600, 'Brown', NULL),
  (rid, 2, 'Cook Base', 'Saute onion and garlic until softened. Add tomatoes and curry powder. Cook until tomatoes break down.', 480, 'Saute', NULL),
  (rid, 3, 'Add Peanut Butter', 'Dissolve peanut butter in water until smooth. Pour into the pot and stir well. Return chicken.', NULL, NULL, 'Mix peanut butter with water separately first to prevent lumps in the stew.'),
  (rid, 4, 'Simmer', 'Bring to a gentle boil, then reduce heat. Cover and simmer until chicken is tender and sauce is thick.', 1800, 'Simmer', 'Stir occasionally to prevent the peanut sauce from sticking to the bottom.'),
  (rid, 5, 'Serve', 'Serve dovi over sadza or rice. The thick peanut sauce should coat the back of a spoon.', NULL, NULL, 'Dovi is even better reheated the next day as the peanut sauce intensifies.');
END $$;

-- =========================
-- MALAWI (MW) - 3 recipes
-- =========================

-- 28. Nsima with Chambo
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'nsima-chambo', 'Nsima with Chambo', 'Nsima ndi Chambo',
    'Malawi''s pride — firm maize porridge served with grilled chambo fish from Lake Malawi, the country''s most prized catch.',
    'MW', 'Malawi', 'East Africa', 'main',
    ARRAY['fish','staple','lake-malawi','national'],
    ARRAY['gluten-free','dairy-free','nut-free','halal','pescatarian'],
    15, 35, 'easy', 4,
    'Chambo is a tilapia species found only in Lake Malawi and is the national fish. Grilled whole over charcoal and served with nsima, it is the ultimate Malawian meal. Lake Malawi, the third largest lake in Africa, provides this cherished fish that is central to the country''s identity and cuisine.',
    390, 32, 48, 8, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Nsima', 2, 'cups', 'white maize flour', 'fine', false, NULL),
  (rid, 2, 'Nsima', 4, 'cups', 'water', NULL, false, NULL),
  (rid, 3, 'Fish', 2, 'whole', 'whole tilapia', 'cleaned, scored', false, 'any whole white fish'),
  (rid, 4, 'Fish', 2, 'whole', 'lemons', 'juiced', false, NULL),
  (rid, 5, 'Fish', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, 'Fish', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 7, 'Fish', 0.5, 'tsp', 'black pepper', NULL, false, NULL),
  (rid, 8, 'Fish', 1, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 9, 'Ndiwo', 2, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 10, 'Ndiwo', 1, 'whole', 'onion', 'sliced', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Season Fish', 'Score fish on both sides with deep diagonal cuts. Rub with lemon juice, garlic, salt, pepper, and oil. Let marinate 20 minutes.', 1200, 'Marinate', 'Deep scores allow seasoning to penetrate and help the fish cook evenly.'),
  (rid, 2, 'Grill Fish', 'Grill fish over hot charcoal or broil in oven, turning once, until skin is crispy and flesh flakes easily.', 1200, 'Grill', 'Oil the grill grate first to prevent sticking — or use a fish grilling basket.'),
  (rid, 3, 'Make Ndiwo', 'Saute onions in oil until soft. Add tomatoes and cook into a thick relish. Season with salt.', 480, 'Cook relish', NULL),
  (rid, 4, 'Cook Nsima', 'Boil water, add maize flour gradually while stirring vigorously. Cook until thick and smooth, pulling away from sides.', 900, 'Cook nsima', 'Nsima should be smoother and slightly softer than Zambian nshima.'),
  (rid, 5, 'Serve', 'Place nsima dome on plate with grilled chambo and tomato ndiwo alongside. Serve with a lemon wedge.', NULL, NULL, 'In Malawi, the fish head is considered the best part and is offered to the guest of honor.');
END $$;

-- 29. Kondowole
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kondowole', 'Kondowole', 'Kondowole',
    'Thick cassava porridge from northern Malawi — a starchy staple with a distinctive chewy texture.',
    'MW', 'Malawi', 'East Africa', 'main',
    ARRAY['cassava','staple','northern','traditional'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    10, 25, 'easy', 4,
    'Kondowole is the cassava-based staple of northern Malawi, where cassava grows abundantly. Unlike nsima, which is made from maize, kondowole has a distinctive sticky, chewy texture that northerners are deeply proud of. It is often the subject of friendly regional rivalries with maize-eating southerners.',
    260, 2, 62, 0.5, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 2, 'cups', 'cassava flour', 'fine', false, NULL),
  (rid, 2, 'Main', 3, 'cups', 'water', NULL, false, NULL),
  (rid, 3, 'Main', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, 'Relish', 1, 'bunch', 'mustard greens', 'chopped', false, 'collards'),
  (rid, 5, 'Relish', 2, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 6, 'Relish', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 7, 'Relish', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 8, 'Relish', 1, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil Water', 'Bring 3 cups of water to a boil. Add salt.', 600, 'Boil', NULL),
  (rid, 2, 'Make Kondowole', 'Reduce heat to medium. Add cassava flour gradually, stirring vigorously. The mixture will become very thick and stretchy. Keep stirring until it forms a cohesive, elastic mass.', 900, 'Cook', 'Kondowole requires more arm strength than nsima — the cassava makes it very sticky and resistant.'),
  (rid, 3, 'Cook Greens', 'Heat oil in a pan. Saute onions until soft. Add tomatoes and cook down. Add greens and cook until wilted and tender.', 600, 'Cook relish', NULL),
  (rid, 4, 'Shape', 'Wet a plate and turn kondowole onto it. Shape into a dome with a wet spoon.', NULL, NULL, 'Wet everything — kondowole is much stickier than maize-based porridges.'),
  (rid, 5, 'Serve', 'Serve kondowole with the greens relish and dried fish if available.', NULL, NULL, 'Kondowole pairs especially well with dried fish (usipa) from Lake Malawi.');
END $$;

-- 30. Mandasi
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'mandasi', 'Mandasi', 'Mandasi',
    'Malawian fried dough balls spiced with cardamom and coconut milk — a sweet breakfast treat or snack.',
    'MW', 'Malawi', 'East Africa', 'breakfast',
    ARRAY['fried','dough','sweet','breakfast','street-food'],
    ARRAY['vegan','nut-free','halal'],
    20, 20, 'easy', 12,
    'Mandasi are the East African answer to donuts — golden, puffy balls of fried dough found at every market and bus station in Malawi. Flavored with coconut milk and cardamom, they are the perfect breakfast paired with sweet tea. Their aroma wafting from roadside vendors is one of the defining scents of Malawian mornings.',
    140, 3, 18, 6, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Dough', 3, 'cups', 'all-purpose flour', NULL, false, NULL),
  (rid, 2, 'Dough', 200, 'ml', 'coconut milk', 'warm', false, NULL),
  (rid, 3, 'Dough', 3, 'tbsp', 'sugar', NULL, false, NULL),
  (rid, 4, 'Dough', 1, 'tsp', 'instant yeast', NULL, false, NULL),
  (rid, 5, 'Dough', 0.5, 'tsp', 'cardamom', 'ground', false, NULL),
  (rid, 6, 'Dough', 0.25, 'tsp', 'nutmeg', 'grated', true, NULL),
  (rid, 7, 'Dough', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 8, 'Dough', 1, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 9, 'Frying', 3, 'cups', 'vegetable oil', 'for deep frying', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make Dough', 'Mix flour, sugar, yeast, cardamom, nutmeg, and salt. Add warm coconut milk and oil. Knead into a soft, smooth dough.', NULL, NULL, 'The dough should be soft but not sticky — add flour if too wet.'),
  (rid, 2, 'Rise', 'Cover dough and let rise in a warm place for 1 hour until doubled in size.', 3600, 'Rise', 'Warm coconut milk activates the yeast faster for a better rise.'),
  (rid, 3, 'Shape', 'Punch down dough. Pull off golf ball-sized pieces and shape into balls or flatten into small discs.', NULL, NULL, NULL),
  (rid, 4, 'Fry', 'Heat oil to 170C. Fry mandasi in batches, turning once, until golden brown on all sides. Drain on paper towels.', 900, 'Deep fry', 'Do not overcrowd the oil — fry 3-4 at a time for even cooking.'),
  (rid, 5, 'Serve', 'Serve warm with tea or coffee. Optionally dust with powdered sugar.', NULL, NULL, 'Mandasi are best eaten warm and fresh — they lose their puffiness as they cool.');
END $$;

-- =========================
-- SOMALIA (SO) - 3 recipes
-- =========================

-- 31. Bariis Iskukaris
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'bariis-iskukaris', 'Bariis Iskukaris', 'Bariis Iskukaris',
    'Somali spiced rice with tender goat, raisins, and a fragrant blend of cumin, cardamom, and cinnamon.',
    'SO', 'Somalia', 'East Africa', 'main',
    ARRAY['rice','spiced','goat','celebration'],
    ARRAY['gluten-free','dairy-free','halal'],
    25, 60, 'medium', 6,
    'Bariis Iskukaris is the centerpiece of Somali feasts, prepared for Eid celebrations, weddings, and Friday lunches. The name means "mixed rice" and reflects the Somali genius for spice blending, influenced by centuries of trade across the Indian Ocean. Each family guards their xawaash spice blend recipe as a treasured secret.',
    490, 26, 58, 17, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Rice', 3, 'cups', 'basmati rice', 'soaked 30 min', false, NULL),
  (rid, 2, 'Meat', 500, 'g', 'goat meat', 'cubed', false, 'lamb'),
  (rid, 3, 'Aromatics', 2, 'whole', 'onions', 'diced', false, NULL),
  (rid, 4, 'Aromatics', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, 'Spices', 2, 'tbsp', 'xawaash spice mix', NULL, false, 'garam masala'),
  (rid, 6, 'Spices', 1, 'tsp', 'cumin', 'ground', false, NULL),
  (rid, 7, 'Spices', 4, 'whole', 'cardamom pods', NULL, false, NULL),
  (rid, 8, 'Spices', 1, 'stick', 'cinnamon', NULL, false, NULL),
  (rid, 9, 'Extras', 0.25, 'cup', 'raisins', NULL, true, NULL),
  (rid, 10, 'Extras', 3, 'tbsp', 'vegetable oil', NULL, false, 'ghee'),
  (rid, 11, 'Extras', 4, 'cups', 'water', NULL, false, NULL),
  (rid, 12, 'Extras', 1.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 13, 'Garnish', 0.25, 'cup', 'fresh cilantro', 'chopped', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook Meat', 'Heat oil in a pot. Brown goat meat on all sides. Add one diced onion, garlic, and half the xawaash. Add water to cover and simmer until tender. Reserve broth.', 2400, 'Simmer meat', 'Cook the meat until very tender — the broth becomes the flavorful liquid for the rice.'),
  (rid, 2, 'Caramelize Onions', 'In a separate pot, heat oil and caramelize the remaining onion until golden brown.', 600, 'Caramelize', NULL),
  (rid, 3, 'Toast Spices', 'Add remaining xawaash, cumin, cardamom, and cinnamon to the onions. Stir for 1 minute until fragrant.', 60, 'Toast', NULL),
  (rid, 4, 'Cook Rice', 'Add drained rice and raisins. Pour in 4 cups of the reserved meat broth. Bring to boil, reduce to lowest heat, cover tightly, and cook until rice is fluffy.', 1200, 'Cook rice', 'Use the meat broth instead of water — this is what makes Somali rice so flavorful.'),
  (rid, 5, 'Combine', 'Fluff rice and gently fold in the cooked meat. Let rest covered for 5 minutes.', 300, 'Rest', NULL),
  (rid, 6, 'Serve', 'Mound on a large platter, garnish with cilantro. Serve with banana and salad on the side.', NULL, NULL, 'Somalis traditionally eat bariis with a banana — the sweetness complements the spices.');
END $$;

-- 32. Canjeero
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'canjeero', 'Canjeero', 'Canjeero',
    'Somali fermented pancake — spongy, slightly sour, and served for breakfast with butter, sugar, or stew.',
    'SO', 'Somalia', 'East Africa', 'breakfast',
    ARRAY['fermented','pancake','breakfast','staple'],
    ARRAY['vegan','dairy-free','nut-free','halal'],
    15, 20, 'medium', 6,
    'Canjeero (also called laxoox or lahoh) is the Somali breakfast staple, similar to Ethiopian injera but lighter and thinner. The batter ferments overnight to develop its sour tang and bubbly texture. Every Somali morning begins with canjeero drizzled with butter and sugar, or topped with liver and onions for a hearty start.',
    170, 4, 34, 2, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Batter', 2, 'cups', 'all-purpose flour', NULL, false, NULL),
  (rid, 2, 'Batter', 0.5, 'cup', 'cornmeal', 'fine', false, NULL),
  (rid, 3, 'Batter', 2.5, 'cups', 'warm water', NULL, false, NULL),
  (rid, 4, 'Batter', 1, 'tsp', 'instant yeast', NULL, false, NULL),
  (rid, 5, 'Batter', 1, 'tbsp', 'sugar', NULL, false, NULL),
  (rid, 6, 'Batter', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 7, 'Serving', 2, 'tbsp', 'butter', 'melted', true, 'ghee'),
  (rid, 8, 'Serving', 2, 'tbsp', 'sugar', 'for sprinkling', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Mix Batter', 'Combine flour, cornmeal, sugar, yeast, and salt. Add warm water and whisk until smooth with no lumps. The batter should be thinner than pancake batter.', NULL, NULL, NULL),
  (rid, 2, 'Ferment', 'Cover batter loosely and let ferment at room temperature for at least 3 hours, or overnight for best flavor.', NULL, NULL, 'Overnight fermentation gives the best sour flavor and bubbly texture.'),
  (rid, 3, 'Stir Batter', 'The batter will be bubbly. Give it a gentle stir. It should pour easily — add water if too thick.', NULL, NULL, NULL),
  (rid, 4, 'Cook Canjeero', 'Heat a non-stick pan over medium heat. Pour batter in a thin layer, swirling to cover. Cook until the surface is covered in holes and edges lift. Do not flip.', 120, 'Cook one canjeero', 'Like injera, canjeero is only cooked on one side — the top should be spongy with many eyes.'),
  (rid, 5, 'Serve', 'Fold canjeero into quarters. Drizzle with melted butter and sprinkle with sugar. Or serve alongside stew for dipping.', NULL, NULL, 'For a traditional Somali breakfast, serve with suqaar (sauteed meat) and a cup of shaah (spiced tea).');
END $$;

-- 33. Suqaar
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'suqaar', 'Suqaar', 'Suqaar',
    'Somali sauteed meat with peppers, onions, and aromatic spices — a quick, flavorful everyday dish.',
    'SO', 'Somalia', 'East Africa', 'main',
    ARRAY['sauteed','quick','meat','everyday'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    15, 20, 'easy', 4,
    'Suqaar is the everyday Somali dish that appears at breakfast, lunch, and dinner in different forms. The word means "small cuts" in Somali, referring to the finely diced meat. It showcases the Somali preference for lean, aromatic meat dishes seasoned with cumin and coriander. Quick to prepare, it fuels the nation.',
    340, 30, 10, 20, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 500, 'g', 'beef sirloin', 'finely diced', false, 'lamb or goat'),
  (rid, 2, 'Main', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 3, 'Main', 1, 'whole', 'green pepper', 'diced', false, NULL),
  (rid, 4, 'Main', 1, 'whole', 'red pepper', 'diced', false, NULL),
  (rid, 5, 'Main', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, 'Main', 2, 'whole', 'tomatoes', 'diced', false, NULL),
  (rid, 7, 'Main', 1, 'whole', 'jalapeno', 'diced', true, NULL),
  (rid, 8, 'Spices', 1, 'tsp', 'cumin', 'ground', false, NULL),
  (rid, 9, 'Spices', 0.5, 'tsp', 'coriander', 'ground', false, NULL),
  (rid, 10, 'Spices', 0.5, 'tsp', 'turmeric', NULL, false, NULL),
  (rid, 11, 'Main', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 12, 'Main', 1, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Sear Meat', 'Heat oil in a pan over high heat. Add diced beef and sear until browned, stirring occasionally.', 480, 'Sear', 'Keep the heat high so the meat sears rather than steams — work in batches if needed.'),
  (rid, 2, 'Add Aromatics', 'Add onion, garlic, and jalapeno. Cook until softened.', 300, 'Saute', NULL),
  (rid, 3, 'Spice', 'Add cumin, coriander, and turmeric. Stir to coat the meat evenly.', 60, 'Toast spices', NULL),
  (rid, 4, 'Add Vegetables', 'Add peppers and tomatoes. Cook until peppers are tender and tomatoes have broken down into a sauce.', 480, 'Cook vegetables', 'The tomatoes should cook down to a thick coating, not a watery sauce.'),
  (rid, 5, 'Serve', 'Season with salt. Serve suqaar with canjeero for breakfast, or with rice or pasta for lunch and dinner.', NULL, NULL, 'Somalis love suqaar with spaghetti — a legacy of Italian colonial influence.');
END $$;

-- =========================
-- BURUNDI (BI) - 3 recipes
-- =========================

-- 34. Burundian Isombe
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'burundian-isombe', 'Burundian Isombe', 'Isombe',
    'Burundi''s version of pounded cassava leaves simmered with palm oil, onions, and a touch of dried fish.',
    'BI', 'Burundi', 'East Africa', 'stew',
    ARRAY['cassava-leaves','traditional','everyday'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    30, 50, 'medium', 4,
    'Isombe is shared across Rwanda and Burundi but each country has its own twist. Burundian isombe often includes dried fish for an umami depth and is simmered longer until silky smooth. It is a dish of resilience, made from cassava leaves that grow abundantly even in difficult times, nourishing families across the country.',
    240, 12, 16, 15, 5, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 500, 'g', 'cassava leaves', 'pounded fine', false, 'spinach'),
  (rid, 2, 'Main', 50, 'g', 'dried fish', 'small, whole', true, 'dried shrimp'),
  (rid, 3, 'Main', 3, 'tbsp', 'palm oil', NULL, false, NULL),
  (rid, 4, 'Main', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 5, 'Main', 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, 'Main', 2, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 7, 'Main', 1, 'whole', 'eggplant', 'diced', true, NULL),
  (rid, 8, 'Main', 1, 'cup', 'water', NULL, false, NULL),
  (rid, 9, 'Main', 1, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare Leaves', 'If using fresh cassava leaves, pound in a mortar to a fine paste. If using frozen, thaw and drain.', NULL, NULL, 'The finer you pound the leaves, the smoother and creamier the final dish.'),
  (rid, 2, 'Cook Base', 'Heat palm oil in a pot. Saute onion and garlic until golden. Add tomatoes and eggplant, cook until softened.', 600, 'Saute', NULL),
  (rid, 3, 'Add Leaves and Fish', 'Add pounded cassava leaves, dried fish, and water. Stir well to combine.', NULL, NULL, 'The dried fish dissolves during cooking and adds deep savory flavor.'),
  (rid, 4, 'Simmer', 'Bring to a boil, then reduce heat. Cover and simmer, stirring occasionally, until leaves are very tender and sauce is thick.', 2400, 'Simmer', 'Burundian cooks simmer isombe for at least 40 minutes — patience makes it silky.'),
  (rid, 5, 'Serve', 'Season with salt. Serve with ubugari (cassava or maize porridge) and beans.', NULL, NULL, 'Isombe and beans together provide complete protein — a traditional Burundian combination.');
END $$;

-- 35. Ubugari
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'ubugari', 'Ubugari', 'Ubugari',
    'Burundi''s cassava flour porridge — smooth, stretchy, and the daily staple that anchors every meal.',
    'BI', 'Burundi', 'East Africa', 'side',
    ARRAY['staple','cassava','everyday','porridge'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    5, 20, 'easy', 4,
    'Ubugari is the daily bread of Burundi, made from cassava flour cooked into a thick, smooth porridge. It serves as the base of virtually every meal, paired with beans, isombe, or fish stew. In Burundian culture, refusing ubugari is considered rude, and the quality of one''s ubugari is a mark of cooking skill.',
    240, 1, 58, 0.3, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 2, 'cups', 'cassava flour', NULL, false, 'maize flour'),
  (rid, 2, 'Main', 3, 'cups', 'water', NULL, false, NULL),
  (rid, 3, 'Main', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, 'Beans', 2, 'cups', 'red kidney beans', 'cooked', false, NULL),
  (rid, 5, 'Beans', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 6, 'Beans', 2, 'tbsp', 'palm oil', NULL, false, NULL),
  (rid, 7, 'Beans', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 8, 'Beans', 2, 'whole', 'tomatoes', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil Water', 'Bring water to a rolling boil in a heavy pot. Add salt.', 600, 'Boil', NULL),
  (rid, 2, 'Cook Ubugari', 'Reduce heat to medium. Add cassava flour gradually, stirring constantly and vigorously with a wooden spoon until thick, smooth, and elastic.', 900, 'Cook', 'Cassava flour thickens faster than maize — add it slowly to control the consistency.'),
  (rid, 3, 'Shape', 'Wet a plate and turn ubugari out in a dome shape. Cover to keep warm.', NULL, NULL, NULL),
  (rid, 4, 'Prepare Beans', 'Heat palm oil in a pan. Saute onion until soft. Add tomatoes and cook until saucy. Add cooked beans and salt. Simmer 10 minutes.', 600, 'Cook beans', 'Palm oil gives the beans their distinctive orange color and rich flavor.'),
  (rid, 5, 'Serve', 'Place ubugari dome on plate with bean stew alongside. Eat by pinching off pieces and dipping.', NULL, NULL, 'In Burundi, ubugari and beans together are considered a complete, balanced meal.');
END $$;

-- 36. Mukeke
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'mukeke', 'Mukeke', 'Mukeke',
    'Lake Tanganyika''s prized fish grilled whole with a zesty lemon-garlic marinade — Burundi''s freshwater treasure.',
    'BI', 'Burundi', 'East Africa', 'main',
    ARRAY['fish','grilled','lake-tanganyika','fresh'],
    ARRAY['gluten-free','dairy-free','nut-free','halal','pescatarian'],
    20, 25, 'easy', 4,
    'Mukeke is a freshwater fish from Lake Tanganyika, the second deepest lake in the world. It is the most prized fish in Burundian cuisine, known for its firm white flesh and clean flavor. Fishermen bring their catch to the lakeside markets of Bujumbura where mukeke commands the highest prices.',
    280, 34, 4, 14, 0, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Fish', 4, 'whole', 'whole tilapia', 'cleaned, scored', false, 'any firm white fish'),
  (rid, 2, 'Marinade', 3, 'whole', 'lemons', 'juiced', false, NULL),
  (rid, 3, 'Marinade', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 4, 'Marinade', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 5, 'Marinade', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 6, 'Marinade', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 7, 'Marinade', 0.5, 'tsp', 'black pepper', NULL, false, NULL),
  (rid, 8, 'Marinade', 1, 'tsp', 'paprika', NULL, false, NULL),
  (rid, 9, 'Side', 2, 'whole', 'tomatoes', 'sliced', false, NULL),
  (rid, 10, 'Side', 1, 'whole', 'onion', 'sliced', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Marinate Fish', 'Score fish deeply on both sides. Mix lemon juice, garlic, ginger, oil, salt, pepper, and paprika. Rub marinade all over and inside the fish.', NULL, NULL, 'Let the fish marinate at least 30 minutes for the lemon and garlic to penetrate.'),
  (rid, 2, 'Heat Grill', 'Heat charcoal grill until coals are white-hot. Oil the grate to prevent sticking.', 1200, 'Heat grill', NULL),
  (rid, 3, 'Grill Fish', 'Grill fish over medium-hot coals, turning once carefully, until skin is charred and flesh is opaque and flakes easily.', 900, 'Grill', 'Use a fish basket or two spatulas to flip — mukeke breaks apart if handled roughly.'),
  (rid, 4, 'Prepare Garnish', 'Arrange sliced tomatoes and onions on a plate. Season with a squeeze of lemon and salt.', NULL, NULL, NULL),
  (rid, 5, 'Serve', 'Place grilled fish on the bed of tomatoes and onions. Serve with ubugari or fried plantains.', NULL, NULL, 'In Bujumbura, grilled mukeke by the lake at sunset is a quintessential Burundian experience.');
END $$;

-- =========================
-- DJIBOUTI (DJ) - 3 recipes
-- =========================

-- 37. Skoudehkaris
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'skoudehkaris', 'Skoudehkaris', 'Skoudehkaris',
    'Djibouti''s national dish — spiced rice with lamb, caramelized onions, cardamom, and cumin, a one-pot feast.',
    'DJ', 'Djibouti', 'East Africa', 'main',
    ARRAY['rice','lamb','national-dish','spiced'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    20, 60, 'medium', 6,
    'Skoudehkaris is the national dish of Djibouti, a fragrant lamb and rice preparation that reflects the country''s position at the crossroads of Somali, Afar, Yemeni, and French culinary influences. Served at every important occasion, it is the dish that unites Djibouti''s diverse communities around one table.',
    480, 28, 55, 16, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 3, 'cups', 'basmati rice', 'soaked 30 min', false, NULL),
  (rid, 2, 'Main', 500, 'g', 'lamb shoulder', 'cubed', false, 'goat'),
  (rid, 3, 'Aromatics', 2, 'whole', 'onions', 'sliced', false, NULL),
  (rid, 4, 'Aromatics', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, 'Aromatics', 1, 'whole', 'tomato', 'chopped', false, NULL),
  (rid, 6, 'Spices', 6, 'whole', 'cardamom pods', NULL, false, NULL),
  (rid, 7, 'Spices', 1, 'tsp', 'cumin', 'ground', false, NULL),
  (rid, 8, 'Spices', 1, 'stick', 'cinnamon', NULL, false, NULL),
  (rid, 9, 'Spices', 0.5, 'tsp', 'turmeric', NULL, false, NULL),
  (rid, 10, 'Cooking', 3, 'tbsp', 'vegetable oil', NULL, false, 'ghee'),
  (rid, 11, 'Cooking', 4, 'cups', 'water', NULL, false, NULL),
  (rid, 12, 'Cooking', 1.5, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown Lamb', 'Heat oil in a heavy pot. Season lamb with salt and sear until deeply browned on all sides.', 600, 'Sear', NULL),
  (rid, 2, 'Cook Aromatics', 'Add onions and cook until caramelized. Add garlic, tomato, cardamom, cumin, cinnamon, and turmeric. Cook 2 minutes.', 720, 'Saute', 'Deeply caramelized onions are essential to the dish''s rich color and sweetness.'),
  (rid, 3, 'Simmer Lamb', 'Add water and bring to a boil. Reduce heat and simmer until lamb is almost tender.', 1800, 'Simmer', NULL),
  (rid, 4, 'Cook Rice', 'Add drained rice to the pot with the lamb and broth. Bring to a boil, then reduce to lowest heat. Cover tightly and cook until rice is fluffy and liquid absorbed.', 1200, 'Cook rice', 'Do not stir once the rice is added — let the steam do the work.'),
  (rid, 5, 'Rest and Serve', 'Let rest covered 10 minutes. Fluff gently. Mound on a platter with lamb arranged on top. Serve with banana and salad.', 600, 'Rest', 'Like Somali bariis, skoudehkaris is traditionally served with a banana on the side.');
END $$;

-- 38. Fah-Fah
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'fah-fah', 'Fah-Fah', 'Fah-Fah',
    'Djibouti''s hearty goat soup with vegetables, cumin, and chili — a restorative broth for all occasions.',
    'DJ', 'Djibouti', 'East Africa', 'soup',
    ARRAY['goat','soup','hearty','restorative'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    20, 90, 'easy', 6,
    'Fah-Fah is a hearty goat bone soup that Djiboutians turn to for warmth, nourishment, and celebration. It is traditionally served to welcome guests, nourish new mothers, and break the Ramadan fast. The slow-simmered broth extracts every bit of flavor from the bones, creating a deeply satisfying soup.',
    320, 26, 15, 18, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 1, 'kg', 'goat meat', 'bone-in pieces', false, 'lamb shanks'),
  (rid, 2, 'Main', 2, 'whole', 'onions', 'quartered', false, NULL),
  (rid, 3, 'Main', 4, 'cloves', 'garlic', 'crushed', false, NULL),
  (rid, 4, 'Main', 2, 'whole', 'carrots', 'chunked', false, NULL),
  (rid, 5, 'Main', 2, 'whole', 'potatoes', 'quartered', false, NULL),
  (rid, 6, 'Main', 1, 'whole', 'green chili', 'whole', false, NULL),
  (rid, 7, 'Spices', 1, 'tsp', 'cumin', 'ground', false, NULL),
  (rid, 8, 'Spices', 0.5, 'tsp', 'coriander', 'ground', false, NULL),
  (rid, 9, 'Spices', 0.5, 'tsp', 'turmeric', NULL, false, NULL),
  (rid, 10, 'Main', 6, 'cups', 'water', NULL, false, NULL),
  (rid, 11, 'Main', 1.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 12, 'Garnish', 0.25, 'cup', 'fresh cilantro', 'chopped', false, NULL),
  (rid, 13, 'Garnish', 1, 'whole', 'lime', 'wedged', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Start Broth', 'Place goat pieces in a large pot with water. Bring to a boil, skimming any foam that rises to the surface.', 600, 'Boil', 'Skimming the foam ensures a clear, clean-tasting broth.'),
  (rid, 2, 'Add Aromatics', 'Add onions, garlic, cumin, coriander, turmeric, and whole chili. Reduce heat and simmer until meat is very tender.', 3600, 'Simmer', 'The longer you simmer, the richer the broth — at least an hour for best results.'),
  (rid, 3, 'Add Vegetables', 'Add carrots and potatoes. Continue simmering until vegetables are tender.', 1200, 'Cook vegetables', NULL),
  (rid, 4, 'Season', 'Remove the whole chili. Season with salt. The broth should be richly flavored.', NULL, NULL, NULL),
  (rid, 5, 'Serve', 'Ladle into deep bowls with meat and vegetables. Garnish with cilantro and a lime wedge. Serve with bread for dipping.', NULL, NULL, 'Fah-Fah is traditionally served in large communal bowls for sharing.');
END $$;

-- 39. Djiboutian Laxoox
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'djiboutian-laxoox', 'Djiboutian Laxoox', 'Laxoox',
    'Djibouti''s spongy fermented crepe made with sorghum and wheat flour — served with honey, ghee, or savory stews.',
    'DJ', 'Djibouti', 'East Africa', 'breakfast',
    ARRAY['fermented','crepe','breakfast','versatile'],
    ARRAY['dairy-free','nut-free','halal','vegetarian'],
    15, 25, 'easy', 8,
    'Laxoox is the daily bread of Djibouti, a spongy fermented crepe that bridges the gap between Ethiopian injera and Yemeni lahoh. Every morning, Djiboutian homes fill with the aroma of laxoox cooking on flat griddles. It is incredibly versatile — drizzled with honey and ghee for a sweet breakfast or used to scoop up spicy stews.',
    160, 4, 30, 3, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Batter', 1.5, 'cups', 'all-purpose flour', NULL, false, NULL),
  (rid, 2, 'Batter', 0.5, 'cup', 'sorghum flour', NULL, false, 'whole wheat flour'),
  (rid, 3, 'Batter', 2, 'cups', 'warm water', NULL, false, NULL),
  (rid, 4, 'Batter', 1, 'tsp', 'instant yeast', NULL, false, NULL),
  (rid, 5, 'Batter', 1, 'tbsp', 'sugar', NULL, false, NULL),
  (rid, 6, 'Batter', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 7, 'Serving', 2, 'tbsp', 'ghee', 'melted', true, 'butter'),
  (rid, 8, 'Serving', 2, 'tbsp', 'honey', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Mix Batter', 'Combine both flours, yeast, sugar, and salt. Add warm water and whisk until smooth and lump-free.', NULL, NULL, NULL),
  (rid, 2, 'Ferment', 'Cover and let batter ferment for 2-3 hours until bubbly and slightly sour-smelling.', NULL, NULL, 'A warm spot speeds fermentation — near an oven or in sunlight works well.'),
  (rid, 3, 'Cook Laxoox', 'Heat a non-stick pan over medium heat. Pour a thin layer of batter, swirling to cover. Cook until surface is covered in bubbles and edges pull away. Do not flip.', 120, 'Cook one laxoox', 'The surface should be covered in tiny holes — this spongy texture is what makes laxoox special.'),
  (rid, 4, 'Stack', 'Remove carefully and stack on a plate. Repeat with remaining batter.', NULL, NULL, NULL),
  (rid, 5, 'Serve', 'Fold or roll laxoox. Drizzle with ghee and honey for sweet breakfast, or serve alongside fah-fah or stew.', NULL, NULL, 'Djiboutians often dip laxoox in sweet spiced tea for a quick morning meal.');
END $$;

-- =========================
-- ERITREA (ER) - 3 recipes
-- =========================

-- 40. Zigini with Injera
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'zigini', 'Zigini with Injera', 'ዝግኒ',
    'Eritrea''s fiery beef stew in berbere sauce served on tangy injera — the country''s most iconic dish.',
    'ER', 'Eritrea', 'East Africa', 'stew',
    ARRAY['beef','spicy','berbere','national'],
    ARRAY['dairy-free','nut-free','halal'],
    25, 75, 'medium', 4,
    'Zigini is Eritrea''s national dish and a source of deep pride. While similar to Ethiopian dishes, Eritrean zigini has its own character — the berbere is often spicier and the niter kibbeh richer. It is the dish served to honored guests and at every celebration. Eritreans abroad say the smell of zigini cooking is the smell of home.',
    420, 32, 12, 26, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 500, 'g', 'beef chuck', 'cubed small', false, 'lamb'),
  (rid, 2, 'Main', 3, 'whole', 'red onions', 'finely diced', false, NULL),
  (rid, 3, 'Main', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 4, 'Main', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 5, 'Main', 3, 'tbsp', 'berbere spice', NULL, false, NULL),
  (rid, 6, 'Main', 3, 'tbsp', 'niter kibbeh', NULL, false, 'spiced ghee'),
  (rid, 7, 'Main', 1, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 8, 'Main', 0.5, 'cup', 'water', NULL, false, NULL),
  (rid, 9, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 10, 'Main', 0.5, 'tsp', 'black pepper', NULL, false, NULL),
  (rid, 11, 'Serving', 6, 'whole', 'injera', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Dry-Cook Onions', 'Place diced onions in a dry pot over medium heat. Cook, stirring frequently, until deeply browned and reduced. Do not add oil or water.', 1800, 'Dry-cook', 'This step is non-negotiable — dry-cooked onions create the foundation of flavor.'),
  (rid, 2, 'Build Sauce', 'Add niter kibbeh, garlic, ginger, and berbere. Stir continuously for 5 minutes. Add tomato paste and water.', 600, 'Build sauce', 'The berbere should toast in the fat until you can smell each individual spice.'),
  (rid, 3, 'Simmer', 'Add beef cubes to the sauce. Stir to coat completely. Cover and simmer on low heat until beef is very tender and sauce is thick.', 2700, 'Simmer', NULL),
  (rid, 4, 'Adjust', 'Check seasoning and add salt. The sauce should be thick enough to cling to the meat without being dry.', NULL, NULL, 'If sauce is too thick, add a splash of water. If too thin, simmer uncovered.'),
  (rid, 5, 'Serve', 'Spread injera on a large platter. Ladle zigini in the center. Serve with extra rolled injera on the side.', NULL, NULL, 'In Eritrean tradition, the eldest person eats first, and feeding someone by hand (suwa) is a sign of love.');
END $$;

-- 41. Shiro
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'eritrean-shiro', 'Eritrean Shiro', 'ሽሮ',
    'Silky Eritrean chickpea flour stew spiced with berbere, garlic, and niter kibbeh — creamy comfort in every bite.',
    'ER', 'Eritrea', 'East Africa', 'stew',
    ARRAY['chickpea','vegan-option','fasting','everyday'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    10, 25, 'easy', 4,
    'Shiro is the everyday hero of Eritrean cuisine and the essential fasting food during Orthodox Christian Lent. Made from roasted chickpea flour, it comes together in under 30 minutes but tastes like it simmered for hours. It is the most affordable and beloved dish in the country, eaten by rich and poor alike.',
    280, 14, 32, 12, 6, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 1, 'cup', 'shiro powder', 'roasted chickpea flour', false, 'chickpea flour with berbere'),
  (rid, 2, 'Main', 1, 'whole', 'onion', 'finely diced', false, NULL),
  (rid, 3, 'Main', 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 4, 'Main', 2, 'tbsp', 'niter kibbeh', NULL, false, 'olive oil for vegan'),
  (rid, 5, 'Main', 1, 'tbsp', 'berbere spice', NULL, false, NULL),
  (rid, 6, 'Main', 1, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 7, 'Main', 2.5, 'cups', 'water', NULL, false, NULL),
  (rid, 8, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 9, 'Optional', 1, 'whole', 'jalapeno', 'diced', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Saute Base', 'Heat niter kibbeh in a pot. Saute onion until softened. Add garlic, berbere, and jalapeno. Cook 2 minutes.', 480, 'Saute', NULL),
  (rid, 2, 'Add Liquid', 'Add tomato paste and water. Bring to a simmer.', 300, 'Heat', NULL),
  (rid, 3, 'Add Shiro', 'Gradually whisk in shiro powder, stirring constantly to prevent lumps. The mixture will thicken quickly.', NULL, NULL, 'Add shiro powder slowly while stirring — it thickens fast and can clump if added too quickly.'),
  (rid, 4, 'Simmer', 'Reduce heat to low. Simmer, stirring frequently, until thick and creamy with a porridge-like consistency.', 900, 'Simmer', 'Shiro should be thick enough to hold its shape on injera but still pourable.'),
  (rid, 5, 'Serve', 'Ladle shiro onto injera. Drizzle with a little extra niter kibbeh on top. Serve hot.', NULL, NULL, 'During fasting season, replace niter kibbeh with olive oil for a fully vegan version.');
END $$;

-- 42. Ful Medames
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'eritrean-ful', 'Eritrean Ful Medames', 'ፉል',
    'Slow-cooked fava beans mashed with olive oil, lemon, cumin, and chili — Eritrea''s beloved breakfast dish.',
    'ER', 'Eritrea', 'East Africa', 'breakfast',
    ARRAY['fava-beans','breakfast','protein','traditional'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    10, 30, 'easy', 4,
    'Ful is the quintessential Eritrean breakfast, served at small restaurants called ful houses across Asmara. Each ful house has its own style — some add yogurt, others add berbere, some top with egg. The dish connects Eritrea to a broader Horn of Africa and Middle Eastern breakfast tradition while maintaining its distinctly Eritrean character.',
    310, 16, 38, 12, 10, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 2, 'cups', 'fava beans', 'canned or cooked', false, NULL),
  (rid, 2, 'Main', 3, 'tbsp', 'olive oil', NULL, false, NULL),
  (rid, 3, 'Main', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 4, 'Main', 1, 'whole', 'lemon', 'juiced', false, NULL),
  (rid, 5, 'Main', 1, 'tsp', 'cumin', 'ground', false, NULL),
  (rid, 6, 'Main', 0.5, 'tsp', 'berbere spice', NULL, true, NULL),
  (rid, 7, 'Main', 1, 'whole', 'tomato', 'diced', false, NULL),
  (rid, 8, 'Main', 1, 'whole', 'green chili', 'chopped', true, NULL),
  (rid, 9, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 10, 'Topping', 1, 'whole', 'egg', 'hard-boiled, halved', true, NULL),
  (rid, 11, 'Serving', 2, 'whole', 'bread rolls', NULL, false, 'injera');

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Heat Beans', 'Place fava beans with their liquid in a pot. Heat over medium, mashing some with a fork for a thick, chunky texture.', 600, 'Heat', 'Mash about half the beans for texture — leave the other half whole.'),
  (rid, 2, 'Season', 'Add garlic, cumin, berbere, and salt. Stir well and cook for 5 minutes until flavors meld.', 300, 'Season', NULL),
  (rid, 3, 'Finish', 'Remove from heat. Stir in olive oil and lemon juice. The ful should be creamy but not soupy.', NULL, NULL, 'Add olive oil off the heat to preserve its flavor.'),
  (rid, 4, 'Garnish', 'Transfer to a bowl. Top with diced tomatoes, green chili, a drizzle of olive oil, and a hard-boiled egg if desired.', NULL, NULL, NULL),
  (rid, 5, 'Serve', 'Serve with crusty bread rolls for scooping, or with injera. Accompany with sweet spiced tea.', NULL, NULL, 'In Asmara, ful is always served with a macchiato — the Italian coffee tradition lives on in Eritrea.');
END $$;

-- =========================
-- COMOROS (KM) - 3 recipes
-- =========================

-- 43. Langouste a la Vanille
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'langouste-vanille', 'Langouste a la Vanille', 'Langouste à la Vanille',
    'Comorian lobster in a luxurious vanilla-infused coconut cream sauce — the islands'' most celebrated dish.',
    'KM', 'Comoros', 'East Africa', 'main',
    ARRAY['lobster','vanilla','coconut','luxury','seafood'],
    ARRAY['gluten-free','nut-free','halal','pescatarian'],
    20, 25, 'medium', 4,
    'Comoros is one of the world''s top vanilla producers, and this dish marries that prized spice with fresh Indian Ocean lobster. The combination of sweet vanilla and briny lobster in coconut cream seems unlikely but creates an unforgettable harmony. It is the signature dish of Comorian haute cuisine, served at celebrations and to honored guests.',
    380, 30, 8, 26, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 4, 'whole', 'lobster tails', 'split lengthwise', false, 'large prawns'),
  (rid, 2, 'Sauce', 400, 'ml', 'coconut cream', NULL, false, NULL),
  (rid, 3, 'Sauce', 2, 'whole', 'vanilla beans', 'split, seeds scraped', false, NULL),
  (rid, 4, 'Sauce', 2, 'whole', 'shallots', 'minced', false, NULL),
  (rid, 5, 'Sauce', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, 'Sauce', 2, 'tbsp', 'butter', NULL, false, NULL),
  (rid, 7, 'Sauce', 0.5, 'cup', 'white wine', NULL, true, 'fish stock'),
  (rid, 8, 'Sauce', 1, 'whole', 'lime', 'juiced', false, NULL),
  (rid, 9, 'Sauce', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 10, 'Sauce', 0.25, 'tsp', 'white pepper', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Sear Lobster', 'Melt butter in a large pan over high heat. Sear lobster tails flesh-side down for 2 minutes until golden. Remove and set aside.', 120, 'Sear', 'Do not overcook at this stage — the lobster will finish cooking in the sauce.'),
  (rid, 2, 'Cook Aromatics', 'In the same pan, saute shallots and garlic until soft. Add white wine and reduce by half.', 300, 'Reduce', NULL),
  (rid, 3, 'Make Sauce', 'Add coconut cream, vanilla bean pods and seeds. Simmer gently until sauce thickens slightly.', 600, 'Simmer', 'Use real vanilla beans — extract cannot replicate the flavor in this dish.'),
  (rid, 4, 'Finish Lobster', 'Return lobster tails to the sauce. Simmer gently until lobster is just cooked through and opaque.', 480, 'Cook lobster', 'Lobster is done when the flesh is opaque and firm — overcooking makes it rubbery.'),
  (rid, 5, 'Serve', 'Remove vanilla pods. Add lime juice and season with salt and white pepper. Serve lobster with the sauce spooned over, alongside rice.', NULL, NULL, 'The vanilla aroma should be present but subtle — it should enhance the lobster, not dominate.');
END $$;

-- 44. Pilao ya Nazi
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'pilao-nazi', 'Pilao ya Nazi', 'Pilao ya Nazi',
    'Comorian coconut rice pilaf infused with cardamom, cloves, and cinnamon — fragrant and creamy.',
    'KM', 'Comoros', 'East Africa', 'side',
    ARRAY['rice','coconut','spiced','aromatic'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    15, 30, 'easy', 6,
    'Pilao ya Nazi showcases the Comorian love for coconut, which appears in nearly every dish on the islands. The rice absorbs the rich coconut milk and warm spices, becoming incredibly fragrant and creamy. It is the perfect accompaniment to the islands'' seafood dishes and is served at every special occasion.',
    340, 5, 52, 14, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 2, 'cups', 'basmati rice', 'rinsed', false, NULL),
  (rid, 2, 'Main', 400, 'ml', 'coconut milk', NULL, false, NULL),
  (rid, 3, 'Main', 1, 'cup', 'water', NULL, false, NULL),
  (rid, 4, 'Spices', 4, 'whole', 'cardamom pods', 'cracked', false, NULL),
  (rid, 5, 'Spices', 4, 'whole', 'cloves', NULL, false, NULL),
  (rid, 6, 'Spices', 1, 'stick', 'cinnamon', NULL, false, NULL),
  (rid, 7, 'Main', 1, 'whole', 'onion', 'sliced', false, NULL),
  (rid, 8, 'Main', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 9, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 10, 'Main', 0.5, 'tsp', 'turmeric', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Saute', 'Heat oil in a pot. Saute sliced onion until golden. Add cardamom, cloves, cinnamon, and turmeric. Stir 1 minute.', 480, 'Saute', NULL),
  (rid, 2, 'Toast Rice', 'Add rinsed rice and stir to coat with the spiced oil. Toast for 2 minutes.', 120, 'Toast', 'Toasting the rice before adding liquid gives each grain a nuttier flavor.'),
  (rid, 3, 'Cook', 'Pour in coconut milk and water. Add salt. Bring to a boil, then reduce to lowest heat. Cover tightly and cook until rice is fluffy and liquid absorbed.', 1200, 'Cook', 'Do not stir or lift the lid — let the steam cook the rice perfectly.'),
  (rid, 4, 'Rest', 'Remove from heat and let rest covered for 10 minutes.', 600, 'Rest', NULL),
  (rid, 5, 'Serve', 'Fluff gently with a fork. Remove whole spices if desired. Serve as a bed for fish, lobster, or meat stew.', NULL, NULL, 'The coconut milk makes the rice slightly sticky and creamy — this is the desired texture.');
END $$;

-- 45. Mkatra Foutra
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'mkatra-foutra', 'Mkatra Foutra', 'Mkatra Foutra',
    'Comorian coconut bread baked with yeast and flavored with cardamom — dense, fragrant, and slightly sweet.',
    'KM', 'Comoros', 'East Africa', 'breakfast',
    ARRAY['bread','coconut','cardamom','baked'],
    ARRAY['vegetarian','nut-free','halal'],
    25, 40, 'medium', 8,
    'Mkatra Foutra is the ceremonial bread of the Comoros Islands, essential at weddings and the Grand Mariage — the most important social ceremony in Comorian culture. The bread is enriched with coconut milk and eggs, scented with cardamom, and baked until golden. No celebration is complete without stacks of mkatra foutra.',
    220, 5, 32, 8, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Dough', 3, 'cups', 'all-purpose flour', NULL, false, NULL),
  (rid, 2, 'Dough', 200, 'ml', 'coconut milk', 'warm', false, NULL),
  (rid, 3, 'Dough', 2, 'whole', 'eggs', 'beaten', false, NULL),
  (rid, 4, 'Dough', 3, 'tbsp', 'sugar', NULL, false, NULL),
  (rid, 5, 'Dough', 1, 'tsp', 'instant yeast', NULL, false, NULL),
  (rid, 6, 'Dough', 1, 'tsp', 'cardamom', 'ground', false, NULL),
  (rid, 7, 'Dough', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 8, 'Dough', 2, 'tbsp', 'butter', 'melted', false, NULL),
  (rid, 9, 'Topping', 1, 'whole', 'egg yolk', 'for glaze', false, NULL),
  (rid, 10, 'Topping', 1, 'tbsp', 'sesame seeds', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make Dough', 'Mix flour, yeast, sugar, cardamom, and salt. Add warm coconut milk, eggs, and butter. Knead for 10 minutes until smooth and elastic.', NULL, NULL, 'The dough should be soft and slightly sticky — do not add too much flour.'),
  (rid, 2, 'First Rise', 'Cover dough and let rise in a warm place for 1.5 hours until doubled.', 5400, 'Rise', 'Coconut milk enriches the dough but can slow rising — be patient.'),
  (rid, 3, 'Shape', 'Punch down dough and shape into a round flat disc about 2 inches thick. Place on a greased baking sheet.', NULL, NULL, NULL),
  (rid, 4, 'Second Rise', 'Let rest 30 minutes. Brush top with egg yolk and sprinkle with sesame seeds.', 1800, 'Rest', NULL),
  (rid, 5, 'Bake', 'Bake at 180C until golden brown and bread sounds hollow when tapped on the bottom.', 1800, 'Bake', 'The bread should be golden brown on top and have a dense, moist crumb inside.'),
  (rid, 6, 'Serve', 'Let cool slightly before slicing. Serve with butter, honey, or alongside fish curry.', NULL, NULL, 'Mkatra foutra stays fresh for several days — its density keeps it moist.');
END $$;

-- =========================
-- SEYCHELLES (SC) - 3 recipes
-- =========================

-- 46. Grilled Fish Creole
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'grilled-fish-creole', 'Grilled Fish Creole', 'Pwason Griye Kreol',
    'Seychellois grilled red snapper topped with a vibrant Creole sauce of tomatoes, ginger, chili, and fresh herbs.',
    'SC', 'Seychelles', 'East Africa', 'main',
    ARRAY['fish','creole','grilled','tropical'],
    ARRAY['gluten-free','dairy-free','nut-free','halal','pescatarian'],
    20, 25, 'easy', 4,
    'Fish is the lifeblood of Seychellois cuisine, and this Creole-style preparation is the islands'' most iconic dish. The Creole sauce — a zingy mix of tomatoes, ginger, garlic, and chili — is spooned over perfectly grilled fresh-caught fish. With 115 islands surrounded by the Indian Ocean, every Seychellois family has a fisherman and a Creole sauce recipe.',
    320, 38, 10, 14, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Fish', 4, 'whole', 'red snapper fillets', '200g each', false, 'any firm white fish'),
  (rid, 2, 'Fish', 2, 'tbsp', 'olive oil', NULL, false, NULL),
  (rid, 3, 'Fish', 1, 'whole', 'lemon', 'juiced', false, NULL),
  (rid, 4, 'Fish', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 5, 'Creole Sauce', 4, 'whole', 'tomatoes', 'diced', false, NULL),
  (rid, 6, 'Creole Sauce', 1, 'whole', 'onion', 'diced', false, NULL),
  (rid, 7, 'Creole Sauce', 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 8, 'Creole Sauce', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 9, 'Creole Sauce', 1, 'whole', 'scotch bonnet', 'minced', false, NULL),
  (rid, 10, 'Creole Sauce', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 11, 'Creole Sauce', 0.25, 'cup', 'fresh parsley', 'chopped', false, NULL),
  (rid, 12, 'Creole Sauce', 1, 'tbsp', 'thyme', 'fresh', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Season Fish', 'Rub fish fillets with olive oil, lemon juice, and salt. Let rest 15 minutes.', NULL, NULL, NULL),
  (rid, 2, 'Make Creole Sauce', 'Heat oil in a pan. Saute onion, garlic, and ginger until fragrant. Add tomatoes, scotch bonnet, and thyme. Cook until tomatoes break down into a chunky sauce.', 600, 'Cook sauce', 'The sauce should be chunky, not smooth — the texture is part of the Creole style.'),
  (rid, 3, 'Grill Fish', 'Grill fish fillets over high heat or in a hot pan for 3-4 minutes per side until skin is crispy and flesh flakes easily.', 480, 'Grill', 'Do not move the fish too early — let the skin crisp and release naturally from the grill.'),
  (rid, 4, 'Finish Sauce', 'Stir parsley into the Creole sauce. Season with salt to taste.', NULL, NULL, NULL),
  (rid, 5, 'Serve', 'Place grilled fish on plates and spoon Creole sauce generously over the top. Serve with rice and fried plantains.', NULL, NULL, 'In Seychelles, this dish is enjoyed with your feet in the sand and the ocean in view.');
END $$;

-- 47. Ladob
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'ladob', 'Ladob', 'Ladob',
    'Seychellois sweet dessert of ripe plantains and sweet potatoes simmered in vanilla-scented coconut milk.',
    'SC', 'Seychelles', 'East Africa', 'dessert',
    ARRAY['dessert','coconut','vanilla','plantain','sweet'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    10, 30, 'easy', 4,
    'Ladob is the beloved Seychellois dessert that comes in both sweet and savory versions. The sweet version features ripe plantains and sweet potatoes bathed in vanilla-infused coconut milk. Seychelles is one of the few places that grows its own vanilla, and ladob showcases this precious ingredient in its most comforting form.',
    340, 3, 56, 14, 4, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 4, 'whole', 'ripe plantains', 'peeled, halved', false, NULL),
  (rid, 2, 'Main', 2, 'whole', 'sweet potatoes', 'peeled, chunked', false, NULL),
  (rid, 3, 'Main', 400, 'ml', 'coconut milk', NULL, false, NULL),
  (rid, 4, 'Main', 0.5, 'cup', 'sugar', NULL, false, NULL),
  (rid, 5, 'Main', 1, 'whole', 'vanilla bean', 'split, seeds scraped', false, '1 tsp vanilla extract'),
  (rid, 6, 'Main', 0.25, 'tsp', 'nutmeg', 'grated', false, NULL),
  (rid, 7, 'Main', 0.25, 'tsp', 'salt', NULL, false, NULL),
  (rid, 8, 'Main', 1, 'cup', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Combine', 'Place coconut milk, water, sugar, vanilla bean and seeds, nutmeg, and salt in a pot. Bring to a gentle simmer.', 300, 'Heat', NULL),
  (rid, 2, 'Add Vegetables', 'Add sweet potato chunks first as they take longer to cook. Simmer until slightly softened.', 600, 'Cook sweet potato', NULL),
  (rid, 3, 'Add Plantains', 'Add plantain halves. Continue simmering gently until both are tender but still holding their shape.', 900, 'Simmer', 'Do not stir too vigorously — you want the plantains and sweet potatoes to stay intact.'),
  (rid, 4, 'Thicken', 'If sauce is too thin, gently remove fruit and reduce the coconut sauce until creamy. Return fruit.', NULL, NULL, 'The sauce should be thick enough to coat the back of a spoon.'),
  (rid, 5, 'Serve', 'Serve warm in bowls with plenty of the vanilla coconut sauce spooned over. Remove vanilla pod before serving.', NULL, NULL, 'Ladob is equally delicious served cold the next day — the flavors deepen overnight.');
END $$;

-- 48. Shark Chutney
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'shark-chutney', 'Shark Chutney', 'Satini Reken',
    'Seychellois condiment of boiled shark meat mashed with bilimbi, lime, onion, and turmeric — tangy and bold.',
    'SC', 'Seychelles', 'East Africa', 'sauce',
    ARRAY['condiment','shark','tangy','unique'],
    ARRAY['gluten-free','dairy-free','nut-free','halal','pescatarian'],
    20, 25, 'medium', 6,
    'Shark chutney (satini reken) is one of the most distinctive dishes in Seychellois cuisine. Shark meat is boiled, skinned, and mashed with bilimbi (a sour tropical fruit), lime, and onion to create a tangy, textured condiment. It is a testament to the Seychellois tradition of using every part of the ocean''s bounty.',
    160, 22, 6, 5, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 500, 'g', 'shark fillet', 'boneless', false, 'swordfish or tuna'),
  (rid, 2, 'Main', 4, 'whole', 'bilimbi', 'sliced', false, 'green mango or tamarind'),
  (rid, 3, 'Main', 2, 'whole', 'limes', 'juiced', false, NULL),
  (rid, 4, 'Main', 1, 'whole', 'onion', 'finely diced', false, NULL),
  (rid, 5, 'Main', 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, 'Main', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 7, 'Main', 0.5, 'tsp', 'turmeric', NULL, false, NULL),
  (rid, 8, 'Main', 1, 'whole', 'scotch bonnet', 'minced', true, NULL),
  (rid, 9, 'Main', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 10, 'Main', 1, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil Shark', 'Place shark fillet in a pot of salted water. Boil until cooked through and firm. Drain, remove any skin, and flake the meat finely.', 900, 'Boil', 'Boiling removes any strong flavor from the shark — drain well.'),
  (rid, 2, 'Cook Bilimbi', 'In a pan, heat oil and saute onion, garlic, and ginger until soft. Add bilimbi and cook until soft and pulpy.', 480, 'Saute', NULL),
  (rid, 3, 'Combine', 'Add flaked shark meat, turmeric, scotch bonnet, and lime juice to the pan. Mash and stir until well combined and mixture has a rough paste-like consistency.', 300, 'Combine', 'The chutney should be chunky, not smooth — the texture is important.'),
  (rid, 4, 'Season', 'Season with salt. Cook 2 more minutes, stirring constantly, to meld flavors.', 120, 'Season', NULL),
  (rid, 5, 'Serve', 'Let cool to room temperature. Serve as a condiment alongside rice, lentils, or grilled fish.', NULL, NULL, 'Shark chutney keeps well refrigerated for 3-4 days and the flavor improves over time.');
END $$;

-- =========================
-- MAURITIUS (MU) - 3 recipes
-- =========================

-- 49. Dholl Puri
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'dholl-puri', 'Dholl Puri', 'Dholl Puri',
    'Mauritius''s beloved street food — soft flatbread stuffed with ground yellow split peas, served with curry and chutneys.',
    'MU', 'Mauritius', 'East Africa', 'snack',
    ARRAY['flatbread','street-food','stuffed','iconic'],
    ARRAY['vegan','dairy-free','nut-free','halal'],
    40, 30, 'hard', 8,
    'Dholl Puri is the undisputed king of Mauritian street food, with origins in the Indian indentured laborers who came to the island in the 19th century. Today it transcends all ethnic boundaries — every Mauritian, regardless of background, grows up eating dholl puri from roadside vendors. It is the great unifier of this multicultural island nation.',
    280, 10, 42, 8, 5, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Dough', 3, 'cups', 'all-purpose flour', NULL, false, NULL),
  (rid, 2, 'Dough', 1, 'cup', 'warm water', NULL, false, NULL),
  (rid, 3, 'Dough', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 4, 'Dough', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 5, 'Filling', 1, 'cup', 'yellow split peas', 'soaked 2 hours', false, NULL),
  (rid, 6, 'Filling', 1, 'tsp', 'cumin', 'ground', false, NULL),
  (rid, 7, 'Filling', 0.5, 'tsp', 'turmeric', NULL, false, NULL),
  (rid, 8, 'Filling', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 9, 'Serving', 1, 'cup', 'butter bean curry', NULL, false, NULL),
  (rid, 10, 'Serving', 0.5, 'cup', 'coriander chutney', NULL, false, NULL),
  (rid, 11, 'Serving', 0.5, 'cup', 'chili paste', NULL, true, NULL),
  (rid, 12, 'Serving', 0.5, 'cup', 'pickled vegetables', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook Split Peas', 'Boil soaked split peas until very soft. Drain well. Grind to a coarse powder with cumin, turmeric, and salt.', 1200, 'Boil peas', 'The split peas must be completely dry before grinding — excess moisture makes the dough soggy.'),
  (rid, 2, 'Make Dough', 'Mix flour, salt, oil, and water into a soft dough. Knead 5 minutes. Rest 30 minutes covered.', NULL, NULL, NULL),
  (rid, 3, 'Stuff', 'Divide dough into balls. Flatten each, place a spoonful of dholl filling in center, fold edges over, and seal. Gently roll out into a thin circle.', NULL, NULL, 'Roll gently to avoid the filling breaking through — if it does, pinch it closed and try again.'),
  (rid, 4, 'Cook', 'Cook on a hot dry tawa or griddle until golden spots appear on both sides. Brush lightly with oil.', 180, 'Cook one puri', 'The puri should puff slightly and have golden-brown spots — do not overcook or it becomes crispy.'),
  (rid, 5, 'Serve', 'Place puri on paper, spread with curry, add coriander chutney and chili paste. Fold and eat with hands.', NULL, NULL, 'The authentic Mauritian way: butter bean curry, coriander chutney, and hot chili — all in one fold.');
END $$;

-- 50. Rougaille
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'rougaille', 'Rougaille', 'Rougaille Saucisse',
    'Mauritian sausage simmered in a spiced tomato sauce with thyme, ginger, and chili — the island''s comfort classic.',
    'MU', 'Mauritius', 'East Africa', 'main',
    ARRAY['sausage','tomato-sauce','comfort-food','creole'],
    ARRAY['dairy-free','nut-free'],
    15, 30, 'easy', 4,
    'Rougaille is the cornerstone of Mauritian Creole home cooking, a rich tomato-based sauce that can be made with sausages, fish, or salted fish. The sausage version (rougaille saucisse) is the most popular weeknight dinner on the island. Its French name betrays the colonial influence, but the bold use of ginger, chili, and thyme is purely Mauritian.',
    380, 18, 12, 28, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 6, 'whole', 'pork sausages', 'sliced 1-inch pieces', false, 'chicken sausages'),
  (rid, 2, 'Sauce', 5, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 3, 'Sauce', 2, 'whole', 'onions', 'diced', false, NULL),
  (rid, 4, 'Sauce', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, 'Sauce', 1, 'inch', 'ginger', 'grated', false, NULL),
  (rid, 6, 'Sauce', 2, 'sprigs', 'thyme', 'fresh', false, NULL),
  (rid, 7, 'Sauce', 1, 'whole', 'scotch bonnet', 'whole', true, NULL),
  (rid, 8, 'Sauce', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 9, 'Sauce', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 10, 'Sauce', 0.25, 'cup', 'fresh parsley', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown Sausages', 'Heat oil in a pot. Brown sausage pieces on all sides until golden. Remove and set aside.', 480, 'Brown', NULL),
  (rid, 2, 'Cook Aromatics', 'In the same pot, saute onions until translucent. Add garlic, ginger, and thyme. Cook 2 minutes.', 360, 'Saute', NULL),
  (rid, 3, 'Add Tomatoes', 'Add chopped tomatoes and whole scotch bonnet. Cook, stirring occasionally, until tomatoes completely break down into a thick sauce.', 600, 'Cook tomatoes', 'Crush the tomatoes with your spoon to help them break down faster.'),
  (rid, 4, 'Simmer', 'Return sausages to the pot. Stir to coat in sauce. Cover and simmer until sauce is rich and thick.', 900, 'Simmer', 'The sauce should be thick and coating, not watery — reduce uncovered if needed.'),
  (rid, 5, 'Serve', 'Remove scotch bonnet and thyme sprigs. Stir in parsley. Serve over steamed basmati rice.', NULL, NULL, 'Rougaille is even better the next day — make extra and reheat for lunch.');
END $$;

-- 51. Gateau Piment
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'gateau-piment', 'Gateau Piment', 'Gateau Piment',
    'Mauritius''s crispy chili lentil fritters — golden outside, soft inside, with a kick of green chili and cumin.',
    'MU', 'Mauritius', 'East Africa', 'snack',
    ARRAY['fritter','lentil','chili','street-food','crispy'],
    ARRAY['vegan','gluten-free','dairy-free','nut-free','halal'],
    20, 20, 'easy', 20,
    'Gateau piment literally means "chili cake" in Mauritian Creole, and these addictive lentil fritters are found at every street corner on the island. Made from soaked yellow split peas ground with green chilies, cumin, and fresh herbs, they are deep-fried to golden perfection. They are Mauritius''s answer to falafel and are typically tucked inside a buttered baguette.',
    60, 3, 6, 3, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 2, 'cups', 'yellow split peas', 'soaked overnight', false, NULL),
  (rid, 2, 'Main', 3, 'whole', 'green chilies', 'chopped', false, NULL),
  (rid, 3, 'Main', 1, 'whole', 'onion', 'finely diced', false, NULL),
  (rid, 4, 'Main', 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 5, 'Main', 1, 'tsp', 'cumin', 'ground', false, NULL),
  (rid, 6, 'Main', 0.5, 'tsp', 'turmeric', NULL, false, NULL),
  (rid, 7, 'Main', 0.25, 'cup', 'fresh cilantro', 'chopped', false, NULL),
  (rid, 8, 'Main', 0.25, 'cup', 'spring onions', 'sliced', false, NULL),
  (rid, 9, 'Main', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 10, 'Main', 0.5, 'tsp', 'baking soda', NULL, false, NULL),
  (rid, 11, 'Frying', 3, 'cups', 'vegetable oil', 'for deep frying', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Grind Peas', 'Drain soaked split peas. Grind in a food processor to a coarse paste — not too smooth, some texture should remain.', NULL, NULL, 'Do not add water — the paste should be thick enough to shape. Some coarse bits add crunch.'),
  (rid, 2, 'Mix', 'Add chilies, onion, garlic, cumin, turmeric, cilantro, spring onions, salt, and baking soda to the paste. Mix well.', NULL, NULL, NULL),
  (rid, 3, 'Shape', 'With wet hands, form small balls slightly smaller than a golf ball.', NULL, NULL, 'Dip your hands in water frequently — the paste is sticky.'),
  (rid, 4, 'Fry', 'Heat oil to 170C. Fry fritters in batches until deep golden brown and crispy on the outside.', 900, 'Deep fry', 'Fry on medium heat so the inside cooks through before the outside burns.'),
  (rid, 5, 'Serve', 'Drain on paper towels. Serve hot, either plain as a snack or stuffed inside a buttered baguette.', NULL, NULL, 'The classic Mauritian way: split a baguette, butter it, stuff with gateau piment, and add chili sauce.');
END $$;

-- =========================
-- SOUTH SUDAN (SS) - 3 recipes
-- =========================

-- 52. Kisra with Mulah
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kisra-mulah', 'Kisra with Mulah', 'Kisra with Mulah',
    'South Sudan''s staple fermented sorghum flatbread served with a rich meat and okra stew.',
    'SS', 'South Sudan', 'East Africa', 'main',
    ARRAY['fermented','sorghum','stew','staple'],
    ARRAY['dairy-free','nut-free','halal'],
    20, 60, 'medium', 4,
    'Kisra is the daily bread of South Sudan, a thin fermented sorghum crepe that is the foundation of every meal. Mulah, meaning stew, varies by region and season but always features locally available ingredients. Together, kisra and mulah represent the culinary identity of the world''s youngest nation, carrying forward food traditions that predate its borders.',
    420, 28, 48, 14, 4, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Kisra', 2, 'cups', 'sorghum flour', NULL, false, 'millet flour'),
  (rid, 2, 'Kisra', 2.5, 'cups', 'warm water', NULL, false, NULL),
  (rid, 3, 'Kisra', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, 'Mulah', 500, 'g', 'beef', 'cubed', false, 'goat'),
  (rid, 5, 'Mulah', 2, 'cups', 'okra', 'sliced', false, NULL),
  (rid, 6, 'Mulah', 2, 'whole', 'onions', 'diced', false, NULL),
  (rid, 7, 'Mulah', 3, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 8, 'Mulah', 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 9, 'Mulah', 2, 'tbsp', 'peanut butter', NULL, true, NULL),
  (rid, 10, 'Mulah', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 11, 'Mulah', 1.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 12, 'Mulah', 2, 'cups', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Ferment Kisra Batter', 'Mix sorghum flour with warm water to form a thin batter. Cover and ferment in a warm place for at least 8 hours or overnight.', NULL, NULL, 'The fermentation gives kisra its signature sour taste — do not skip this step.'),
  (rid, 2, 'Cook Mulah', 'Heat oil in a pot. Brown beef on all sides. Add onions and garlic, cook until softened. Add tomatoes and water. Simmer until beef is tender.', 2400, 'Simmer stew', NULL),
  (rid, 3, 'Add Okra', 'Add sliced okra and peanut butter to the stew. Stir well and simmer until okra is tender and stew is thick.', 900, 'Cook okra', 'The okra and peanut butter together create a thick, silky sauce.'),
  (rid, 4, 'Cook Kisra', 'Stir fermented batter and add salt. Heat a non-stick pan. Pour a thin layer of batter, tilting to spread. Cook until set and edges lift. Do not flip.', 120, 'Cook one kisra', 'Kisra should be paper-thin — pour as little batter as possible.'),
  (rid, 5, 'Serve', 'Roll or fold kisra and arrange on a plate. Ladle mulah alongside or on top. Eat by tearing kisra and scooping the stew.', NULL, NULL, 'In South Sudan, meals are communal — everyone eats from one shared platter.');
END $$;

-- 53. Asida
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'asida', 'Asida', 'Asida',
    'South Sudanese smooth wheat porridge shaped into a dome, served with stew poured around it — simple and filling.',
    'SS', 'South Sudan', 'East Africa', 'side',
    ARRAY['porridge','staple','wheat','traditional'],
    ARRAY['vegan','dairy-free','nut-free','halal'],
    5, 15, 'easy', 4,
    'Asida is a smooth, dense porridge made from wheat or sorghum flour that is a staple across South Sudan and the broader Sahel region. Its simplicity belies its importance — asida has sustained communities through times of plenty and hardship alike. The dome shape and the crater for stew make it both beautiful and functional.',
    280, 6, 58, 2, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 2, 'cups', 'wheat flour', NULL, false, 'sorghum flour'),
  (rid, 2, 'Main', 3, 'cups', 'water', NULL, false, NULL),
  (rid, 3, 'Main', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, 'Stew', 2, 'cups', 'prepared mulah', 'any meat or vegetable stew', false, NULL),
  (rid, 5, 'Garnish', 2, 'tbsp', 'ghee', 'melted', true, 'butter'),
  (rid, 6, 'Garnish', 2, 'tbsp', 'honey', NULL, true, NULL),
  (rid, 7, 'Main', 1, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 8, 'Main', 0.5, 'cup', 'water', 'extra for adjusting', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil Water', 'Bring 3 cups of water to a boil in a heavy pot. Add salt and oil.', 600, 'Boil', NULL),
  (rid, 2, 'Add Flour', 'Reduce heat to medium-low. Gradually add flour while stirring constantly and vigorously with a wooden spoon. The mixture should become very smooth with no lumps.', 600, 'Cook', 'Stir in one direction only to develop a smooth, cohesive texture.'),
  (rid, 3, 'Cook Through', 'Continue stirring until the asida is very thick, smooth, and pulls cleanly from the sides of the pot.', 300, 'Thicken', 'The asida is ready when it holds its shape and has a shiny, smooth surface.'),
  (rid, 4, 'Shape', 'Wet a deep plate. Turn asida onto it and shape into a smooth dome using a wet spoon. Make a well in the center.', NULL, NULL, NULL),
  (rid, 5, 'Serve', 'Pour stew around the base and into the well. Drizzle with ghee or honey. Eat by pinching off pieces and dipping into the stew.', NULL, NULL, 'Asida can be served sweet with honey and ghee for breakfast, or savory with mulah for dinner.');
END $$;

-- 54. Bamia
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'bamia', 'Bamia', 'Bamia',
    'South Sudanese okra and lamb stew with tomatoes, onions, and garlic — thick, hearty, and rich in flavor.',
    'SS', 'South Sudan', 'East Africa', 'stew',
    ARRAY['okra','lamb','stew','traditional'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    15, 50, 'easy', 4,
    'Bamia is the classic okra stew of South Sudan, a dish shared across the Nile Valley cuisines. The okra gives the stew its characteristic thick, silky texture that South Sudanese cooks treasure. Bamia is the kind of dish grandmothers make to feed their families — simple, nourishing, and deeply comforting.',
    360, 26, 14, 22, 4, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Main', 500, 'g', 'lamb shoulder', 'cubed', false, 'beef'),
  (rid, 2, 'Main', 3, 'cups', 'okra', 'sliced into rounds', false, NULL),
  (rid, 3, 'Main', 3, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 4, 'Main', 2, 'whole', 'onions', 'diced', false, NULL),
  (rid, 5, 'Main', 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, 'Main', 1, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 7, 'Main', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 8, 'Main', 1, 'tsp', 'cumin', 'ground', false, NULL),
  (rid, 9, 'Main', 0.5, 'tsp', 'coriander', 'ground', false, NULL),
  (rid, 10, 'Main', 1, 'cup', 'water', NULL, false, NULL),
  (rid, 11, 'Main', 1.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 12, 'Main', 0.5, 'tsp', 'black pepper', NULL, false, NULL),
  (rid, 13, 'Garnish', 0.25, 'cup', 'fresh cilantro', 'chopped', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown Lamb', 'Heat oil in a heavy pot over high heat. Season lamb with salt, pepper, cumin, and coriander. Sear until browned on all sides.', 600, 'Sear', NULL),
  (rid, 2, 'Cook Aromatics', 'Add onions and garlic. Cook until softened. Add tomato paste and stir for 1 minute. Add chopped tomatoes.', 480, 'Saute', NULL),
  (rid, 3, 'Simmer Meat', 'Add water. Bring to a boil, then reduce heat. Cover and simmer until lamb is nearly tender.', 1800, 'Simmer', 'Lamb should be almost falling apart before you add the okra.'),
  (rid, 4, 'Add Okra', 'Add sliced okra to the stew. Stir gently and continue simmering until okra is tender and has thickened the stew.', 900, 'Cook okra', 'The okra releases a natural thickener — stir gently to keep the rounds intact.'),
  (rid, 5, 'Serve', 'Adjust seasoning with salt. Garnish with cilantro. Serve hot with kisra, asida, or rice.', NULL, NULL, 'Bamia should be thick and rich — if too thin, simmer uncovered until it reaches the right consistency.');
END $$;
