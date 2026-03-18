-- AfroKitchen Seed Data — Batch 4: Southern Africa
-- 6 countries × 3 recipes = 18 recipes

-- ===================
-- SOUTH AFRICA (ZA)
-- ===================

-- 1. Bobotie (South Africa)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'bobotie-za', 'Bobotie', NULL,
    'South Africa''s beloved national dish — spiced curried mince baked under a creamy egg custard topping, with a sweet-savory flavor from raisins, chutney, and turmeric.',
    'ZA', 'South Africa', 'Southern Africa', 'Cape Malay', 'main',
    ARRAY['national dish','cape malay','comfort food','baked','mince'],
    ARRAY['nut-free'],
    25, 45, 'medium', 6,
    'Bobotie traces its roots to the Cape Malay community of Cape Town, descendants of Southeast Asian workers brought to the Cape in the 17th century. The dish blends Indonesian-inspired spices with African and Dutch culinary traditions, creating something uniquely South African. It has been the country''s national dish since 1999 and remains a staple at family gatherings across the rainbow nation.',
    'Family dinner', 'Yellow rice with raisins and a green salad',
    480, 32, 28, 24, 2, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Meat filling', 1, 'kg', 'beef mince', NULL, false, 'lamb mince'),
  (rid, 2, 'Meat filling', 2, 'whole', 'onions', 'finely diced', false, NULL),
  (rid, 3, 'Meat filling', 2, 'slices', 'white bread', 'soaked in milk', false, NULL),
  (rid, 4, 'Meat filling', 2, 'tbsp', 'curry powder', NULL, false, NULL),
  (rid, 5, 'Meat filling', 1, 'tsp', 'turmeric', 'ground', false, NULL),
  (rid, 6, 'Meat filling', 3, 'tbsp', 'fruit chutney', NULL, false, 'Mrs Ball''s chutney'),
  (rid, 7, 'Meat filling', 60, 'g', 'sultanas', NULL, false, 'raisins'),
  (rid, 8, 'Meat filling', 4, 'whole', 'bay leaves', NULL, false, NULL),
  (rid, 9, 'Custard topping', 3, 'whole', 'eggs', 'beaten', false, NULL),
  (rid, 10, 'Custard topping', 200, 'ml', 'milk', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Soak the bread', 'Tear the bread slices into pieces and soak in 100ml milk for 10 minutes. Squeeze out excess milk and set aside, reserving the milk.', 600, 'Soak bread', NULL),
  (rid, 2, 'Cook the meat filling', 'Heat oil in a large pan over medium heat. Fry the onions until golden, about 5 minutes. Add curry powder and turmeric, stirring for 1 minute. Add the mince and cook until browned, breaking it up with a wooden spoon.', 600, 'Brown mince', NULL),
  (rid, 3, 'Add flavor', 'Stir in the soaked bread, chutney, sultanas, salt, and pepper. Mix well and cook for another 3 minutes until everything is combined. Remove from heat.', 180, 'Combine', 'The soaked bread helps bind the mixture and keeps it moist during baking.'),
  (rid, 4, 'Assemble the dish', 'Preheat oven to 180°C. Spoon the meat mixture into a greased oven-safe dish and press down evenly. Tuck bay leaves into the top of the meat.', NULL, NULL, NULL),
  (rid, 5, 'Make the custard', 'Whisk together the eggs and remaining milk with a pinch of turmeric. Pour evenly over the meat filling.', NULL, NULL, 'Adding a pinch of turmeric to the custard gives it a beautiful golden color.'),
  (rid, 6, 'Bake', 'Bake in the preheated oven for 35-40 minutes until the custard is set and golden brown on top.', 2400, 'Bake bobotie', NULL),
  (rid, 7, 'Serve', 'Let the bobotie rest for 5 minutes, then serve with yellow rice, sambals, and a side salad.', NULL, NULL, 'Traditional accompaniments include banana slices, coconut flakes, and chutney as sambals.');
END $$;

-- 2. Chakalaka (South Africa)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'chakalaka-za', 'Chakalaka', NULL,
    'A vibrant, spicy vegetable relish made with beans, tomatoes, peppers, and carrots — a staple side dish at every South African braai and gathering.',
    'ZA', 'South Africa', 'Southern Africa', 'Zulu', 'side',
    ARRAY['braai','relish','vegetable','spicy','township'],
    ARRAY['vegetarian','vegan','gluten-free','dairy-free','nut-free','halal'],
    15, 30, 'easy', 8,
    'Chakalaka was born in the gold mining townships of Johannesburg, where workers from across Southern Africa combined whatever vegetables and spices they had on hand to create a fiery relish. The dish quickly spread beyond the mines and became an essential part of South African food culture, especially at braais where no spread is complete without a bowl of chakalaka.',
    'Braai', 'Pap and grilled meat',
    180, 8, 26, 5, 7, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 2, NULL, 2, 'whole', 'onions', 'diced', false, NULL),
  (rid, 3, NULL, 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'curry powder', NULL, false, NULL),
  (rid, 5, NULL, 3, 'whole', 'carrots', 'grated', false, NULL),
  (rid, 6, NULL, 1, 'whole', 'green pepper', 'diced', false, NULL),
  (rid, 7, NULL, 1, 'whole', 'red pepper', 'diced', false, NULL),
  (rid, 8, NULL, 400, 'g', 'canned baked beans', NULL, false, NULL),
  (rid, 9, NULL, 400, 'g', 'canned chopped tomatoes', NULL, false, NULL),
  (rid, 10, NULL, 2, 'whole', 'chilli peppers', 'finely chopped', false, 'scotch bonnet');

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Sauté aromatics', 'Heat oil in a large pot over medium heat. Add the onions and fry until translucent, about 4 minutes. Add garlic and curry powder, stirring for 1 minute until fragrant.', 300, 'Sauté onions', NULL),
  (rid, 2, 'Add vegetables', 'Add the grated carrots and diced peppers. Cook for 5 minutes, stirring occasionally, until the vegetables begin to soften.', 300, 'Cook vegetables', NULL),
  (rid, 3, 'Add tomatoes and beans', 'Stir in the chopped tomatoes and chilli peppers. Simmer for 10 minutes until the sauce thickens and the vegetables are tender.', 600, 'Simmer', 'Adjust the chilli to your heat preference — some like it fiery, others mild.'),
  (rid, 4, 'Add beans and finish', 'Add the baked beans, stir gently, and simmer for another 10 minutes. Season with salt and pepper to taste.', 600, 'Final simmer', NULL),
  (rid, 5, 'Rest and serve', 'Remove from heat and let sit for 5 minutes before serving. Chakalaka can be served warm or at room temperature alongside pap and braai meat.', NULL, NULL, 'Chakalaka tastes even better the next day as the flavors develop overnight.');
END $$;

-- 3. Bunny Chow (South Africa)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'bunny-chow-za', 'Bunny Chow', NULL,
    'A Durban original — a hollowed-out loaf of white bread filled with fragrant, slow-cooked lamb or chicken curry, eaten with your hands.',
    'ZA', 'South Africa', 'Southern Africa', 'Indian South African', 'main',
    ARRAY['curry','bread','durban','street food','iconic'],
    ARRAY['nut-free','dairy-free','halal'],
    20, 60, 'medium', 4,
    'Bunny Chow originated in the Indian community of Durban in the 1940s. During apartheid, when non-white South Africans were barred from eating in restaurants, Indian merchants at the Grey Street area began serving curry inside hollowed-out bread loaves as a portable meal. The name''s origin is debated, but the dish has become one of Durban''s most iconic culinary exports.',
    'Lunch', 'Pickled vegetables and grated carrot salad',
    620, 35, 52, 28, 4, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Curry', 800, 'g', 'lamb shoulder', 'cubed', false, 'chicken pieces'),
  (rid, 2, 'Curry', 3, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 3, 'Curry', 2, 'whole', 'onions', 'finely chopped', false, NULL),
  (rid, 4, 'Curry', 3, 'tbsp', 'Durban curry powder', NULL, false, 'Rajah curry powder'),
  (rid, 5, 'Curry', 1, 'tsp', 'garam masala', NULL, false, NULL),
  (rid, 6, 'Curry', 400, 'g', 'canned tomatoes', 'crushed', false, NULL),
  (rid, 7, 'Curry', 3, 'whole', 'potatoes', 'peeled and quartered', false, NULL),
  (rid, 8, 'Curry', 10, 'whole', 'curry leaves', 'fresh', false, NULL),
  (rid, 9, 'Bread', 1, 'whole', 'unsliced white bread loaf', 'half loaf per serving', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the meat', 'Heat oil in a heavy pot over high heat. Season lamb with salt and brown in batches until deep golden on all sides. Remove and set aside.', 480, 'Brown meat', 'Do not overcrowd the pot — browning in batches ensures a good sear.'),
  (rid, 2, 'Cook the curry base', 'Reduce heat to medium. Add onions and cook until golden brown, about 8 minutes. Add curry powder, garam masala, and curry leaves, stirring for 2 minutes until fragrant.', 600, 'Cook base', NULL),
  (rid, 3, 'Simmer the curry', 'Add tomatoes and return the lamb to the pot. Add enough water to just cover the meat. Bring to a boil, then reduce to a low simmer. Cover and cook for 40 minutes.', 2400, 'Simmer curry', NULL),
  (rid, 4, 'Add potatoes', 'Add the potato quarters to the curry. Continue simmering for another 20 minutes until the potatoes are tender and the sauce has thickened.', 1200, 'Cook potatoes', 'The potatoes should be soft enough to break apart slightly, thickening the curry.'),
  (rid, 5, 'Prepare the bread', 'Cut the bread loaf in half. Hollow out each half, leaving about 2cm of bread on the sides and bottom. Keep the scooped-out bread for dipping.', NULL, NULL, NULL),
  (rid, 6, 'Assemble and serve', 'Ladle the hot curry into the hollowed-out bread. Place the bread lid on top. Serve immediately, eating with your hands — tear pieces of bread and scoop up the curry.', NULL, NULL, 'Authentic bunny chow is always eaten with your hands, never cutlery.');
END $$;

-- ===================
-- BOTSWANA (BW)
-- ===================

-- 4. Seswaa (Botswana)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'seswaa-bw', 'Seswaa', NULL,
    'Botswana''s national dish — beef slow-boiled until falling apart, then shredded and pounded to a tender, savory pulled-meat texture, seasoned simply with salt.',
    'BW', 'Botswana', 'Southern Africa', 'Tswana', 'main',
    ARRAY['national dish','beef','slow-cooked','traditional','tswana'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    15, 180, 'easy', 8,
    'Seswaa is the pride of Botswana, served at weddings, funerals, national celebrations, and important family gatherings. The dish is traditionally prepared by men in a large three-legged cast-iron pot over an open fire. The simplicity of the recipe — just meat, water, and salt — allows the quality of Botswana''s grass-fed beef to shine through.',
    'Celebrations and weddings', 'Bogobe (sorghum porridge) or pap',
    380, 42, 1, 22, 0, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1.5, 'kg', 'beef shin or chuck', 'bone-in, cut into large pieces', false, 'goat meat'),
  (rid, 2, NULL, 1, 'whole', 'onion', 'quartered', false, NULL),
  (rid, 3, NULL, 2, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, NULL, 1, 'tsp', 'black pepper', 'ground', true, NULL),
  (rid, 5, NULL, 2, 'litres', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil the meat', 'Place the beef pieces and quartered onion in a large heavy pot. Add enough water to cover the meat by about 5cm. Bring to a boil over high heat.', 600, 'Bring to boil', 'Bone-in cuts give the broth more flavor and body.'),
  (rid, 2, 'Skim and simmer', 'Skim off any foam that rises to the surface. Reduce heat to low, cover, and simmer gently for about 3 hours until the meat is completely tender and falling off the bone.', 10800, 'Slow simmer', 'Check occasionally and add more water if the level drops below the meat.'),
  (rid, 3, 'Remove bones', 'Remove the meat from the pot and discard all bones. Reserve the cooking broth. Place the meat on a large wooden board or in a mortar.', NULL, NULL, NULL),
  (rid, 4, 'Pound and shred', 'Using two forks or a wooden pestle, pound and shred the meat until it has a fine, pulled texture. Season with salt and pepper.', NULL, NULL, 'Traditionally this is done with a wooden pole in the pot itself — the pounding action is what gives seswaa its name.'),
  (rid, 5, 'Moisten and serve', 'Return the shredded meat to the pot and add a few ladles of the reserved broth to keep it moist. Heat through and serve with bogobe, pap, or dumplings.', NULL, NULL, 'The cooking broth is precious — serve some on the side as a gravy.');
END $$;

-- 5. Vetkoek (Botswana)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'vetkoek-bw', 'Vetkoek with Mince', 'Magwinya',
    'Golden deep-fried bread rolls with a crispy exterior and soft, fluffy interior, split open and filled with savory spiced mince — a beloved Southern African street food.',
    'BW', 'Botswana', 'Southern Africa', 'Tswana', 'snack',
    ARRAY['street food','fried bread','snack','popular','filling'],
    ARRAY['nut-free','dairy-free'],
    90, 25, 'medium', 8,
    'Known as magwinya in Botswana and vetkoek in South Africa, these deep-fried dough balls are one of the most popular street foods across Southern Africa. Vendors selling freshly fried magwinya can be found at bus stations, markets, and school gates. They can be filled with savory mince, jam, cheese, or simply eaten plain with butter.',
    'Street food or snack', 'Atchar (pickle) and chilli sauce',
    420, 18, 48, 18, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Dough', 500, 'g', 'bread flour', NULL, false, NULL),
  (rid, 2, 'Dough', 7, 'g', 'instant yeast', '1 sachet', false, NULL),
  (rid, 3, 'Dough', 2, 'tbsp', 'sugar', NULL, false, NULL),
  (rid, 4, 'Dough', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 5, 'Dough', 300, 'ml', 'warm water', NULL, false, NULL),
  (rid, 6, 'Dough', 1, 'litre', 'vegetable oil', 'for deep frying', false, NULL),
  (rid, 7, 'Filling', 500, 'g', 'beef mince', NULL, false, NULL),
  (rid, 8, 'Filling', 1, 'whole', 'onion', 'finely diced', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the dough', 'Mix flour, yeast, sugar, and salt in a large bowl. Add warm water gradually, mixing to form a soft, slightly sticky dough. Knead for 8 minutes until smooth and elastic.', 480, 'Knead dough', 'The dough should be softer than bread dough — slightly sticky is perfect.'),
  (rid, 2, 'Let dough rise', 'Cover the bowl with a damp cloth and leave in a warm place to rise for 1 hour until doubled in size.', 3600, 'Rise dough', NULL),
  (rid, 3, 'Prepare the filling', 'While the dough rises, brown the mince with diced onion in a pan over medium-high heat. Season with salt, pepper, and a pinch of curry powder. Cook until done, about 10 minutes. Set aside.', 600, 'Cook mince', NULL),
  (rid, 4, 'Shape the vetkoek', 'Punch down the dough and divide into 8 equal portions. Roll each into a smooth ball. Let rest for 10 minutes.', 600, 'Rest dough', NULL),
  (rid, 5, 'Deep fry', 'Heat oil to 170°C in a deep pot. Carefully lower 2-3 dough balls at a time into the oil. Fry for 3-4 minutes per side until deep golden brown and cooked through. Drain on paper towels.', 420, 'Fry vetkoek', 'Do not let the oil get too hot or the outside will burn before the inside cooks through.'),
  (rid, 6, 'Fill and serve', 'Slice each vetkoek open along one side. Spoon in the warm mince filling. Serve immediately with chilli sauce or atchar on the side.', NULL, NULL, 'For a sweet version, fill with apricot jam or syrup instead of mince.');
END $$;

-- 6. Morogo (Botswana)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'morogo-bw', 'Morogo', 'Morogo wa Thepe',
    'Traditional wild spinach greens cooked with tomatoes, onions, and peanut powder — a nutritious everyday dish that connects Batswana to their foraging heritage.',
    'BW', 'Botswana', 'Southern Africa', 'Tswana', 'side',
    ARRAY['greens','wild spinach','traditional','healthy','everyday'],
    ARRAY['vegetarian','vegan','gluten-free','dairy-free'],
    15, 20, 'easy', 4,
    'Morogo refers to a variety of wild leafy greens that have been gathered and eaten across Botswana for centuries. These nutrient-dense greens were traditionally foraged from the wild after the rains, dried for preservation, and cooked throughout the year. Today, morogo remains a staple in Batswana homes, valued for both its nutrition and its deep cultural significance.',
    'Everyday meal', 'Pap or bogobe and seswaa',
    145, 7, 12, 8, 5, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'morogo or wild spinach', 'washed and chopped', false, 'regular spinach or amaranth leaves'),
  (rid, 2, NULL, 1, 'whole', 'onion', 'chopped', false, NULL),
  (rid, 3, NULL, 2, 'whole', 'tomatoes', 'diced', false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'peanut powder', NULL, false, 'ground roasted peanuts'),
  (rid, 5, NULL, 1, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 6, NULL, 1, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Sauté onion', 'Heat oil in a pot over medium heat. Add the chopped onion and cook until softened, about 3 minutes.', 180, 'Sauté onion', NULL),
  (rid, 2, 'Add tomatoes', 'Add the diced tomatoes and cook until they break down into a sauce, about 5 minutes, stirring occasionally.', 300, 'Cook tomatoes', NULL),
  (rid, 3, 'Cook the greens', 'Add the chopped morogo to the pot. Stir well, cover, and cook for 10 minutes until the greens are tender and wilted, stirring occasionally.', 600, 'Cook greens', 'If using regular spinach, reduce the cooking time to 5 minutes as it wilts faster.'),
  (rid, 4, 'Add peanut powder', 'Sprinkle the peanut powder over the greens and stir thoroughly. Cook for another 3 minutes to allow the peanut flavor to meld with the vegetables. Season with salt.', 180, 'Finish', 'The peanut powder adds protein and a subtle nutty flavor that is characteristic of this dish.'),
  (rid, 5, 'Serve', 'Serve the morogo warm as a side dish alongside pap, bogobe, or seswaa.', NULL, NULL, 'Morogo can also be dried and stored for months — rehydrate in water before cooking.');
END $$;

-- ===================
-- NAMIBIA (NA)
-- ===================

-- 7. Potjiekos (Namibia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'potjiekos-na', 'Potjiekos', NULL,
    'A traditional Namibian layered stew cooked slowly in a cast-iron three-legged pot over coals — layers of meat, vegetables, and starches meld together without stirring.',
    'NA', 'Namibia', 'Southern Africa', 'Afrikaner Namibian', 'stew',
    ARRAY['potjie','cast iron','outdoor cooking','layered stew','slow-cooked'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    30, 150, 'medium', 8,
    'Potjiekos, meaning "small pot food," is a centuries-old tradition brought to Southern Africa by Dutch settlers and embraced across Namibia. The dish is always cooked outdoors over a low fire in a round, cast-iron pot. The golden rule of potjiekos is never to stir — the ingredients are layered so that each element steams and braises in its own juices, creating complex flavors.',
    'Outdoor gatherings', 'Rice or crusty bread',
    410, 30, 32, 18, 5, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Meat layer', 1, 'kg', 'beef chuck', 'cubed into 4cm pieces', false, 'lamb or game meat'),
  (rid, 2, 'Meat layer', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 3, 'Meat layer', 1, 'whole', 'onion', 'sliced into rings', false, NULL),
  (rid, 4, 'Vegetable layer', 3, 'whole', 'carrots', 'sliced into rounds', false, NULL),
  (rid, 5, 'Vegetable layer', 200, 'g', 'green beans', 'trimmed', false, NULL),
  (rid, 6, 'Vegetable layer', 2, 'whole', 'potatoes', 'quartered', false, NULL),
  (rid, 7, 'Liquid', 250, 'ml', 'beef stock', NULL, false, NULL),
  (rid, 8, 'Liquid', 125, 'ml', 'red wine', NULL, true, 'extra beef stock');

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the meat', 'Heat oil in the potjie pot over medium-hot coals. Brown the beef cubes in batches until well-seared on all sides. Remove and set aside.', 480, 'Brown meat', 'Good browning creates the flavor base for the entire dish.'),
  (rid, 2, 'Layer the onions', 'Spread the onion rings over the bottom of the pot. Place the browned meat on top of the onions. Season with salt and pepper.', NULL, NULL, NULL),
  (rid, 3, 'Layer the vegetables', 'Add the carrots in an even layer over the meat. Follow with the green beans, then the potatoes on top. Season each layer lightly with salt and pepper.', NULL, NULL, 'The order matters — root vegetables near the bottom, delicate ones on top.'),
  (rid, 4, 'Add liquid and seal', 'Pour the beef stock and red wine gently down the side of the pot so as not to disturb the layers. Place the lid on tightly.', NULL, NULL, 'The lid should create a good seal — some cooks place foil under the lid for extra sealing.'),
  (rid, 5, 'Slow cook', 'Reduce the coals to maintain a very gentle simmer. Cook without lifting the lid for 2 to 2.5 hours. Resist the urge to stir — the layers must cook undisturbed.', 8100, 'Slow cook', 'If using a stovetop, keep the heat at the lowest possible setting.'),
  (rid, 6, 'Serve', 'Remove the lid, check that the meat is tender, and gently ladle out portions, keeping the layers visible. Serve with rice or fresh bread.', NULL, NULL, 'The bottom layer will have the richest, most concentrated flavors.');
END $$;

-- 8. Kapana (Namibia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kapana-na', 'Kapana', NULL,
    'Namibia''s iconic street food — beef strips grilled over open coals and tossed with a fresh chilli-tomato salsa, sold at bustling open-air markets.',
    'NA', 'Namibia', 'Southern Africa', 'Owambo', 'snack',
    ARRAY['street food','grilled beef','market food','windhoek','popular'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    15, 15, 'easy', 4,
    'Kapana is the heartbeat of Namibian street food culture, most famously found at the Kapana market in Windhoek''s Katutura township. Vendors grill strips of fresh beef on open-air drum grills, and customers choose their toppings from an array of fresh chilli salsas. It brings communities together daily around the smoke and sizzle of the grill.',
    'Street food or casual lunch', 'Fresh bread rolls and chilli salsa',
    350, 35, 8, 20, 2, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Meat', 800, 'g', 'beef sirloin or rump', 'cut into thick strips', false, NULL),
  (rid, 2, 'Meat', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 3, 'Meat', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, 'Salsa', 3, 'whole', 'tomatoes', 'finely diced', false, NULL),
  (rid, 5, 'Salsa', 1, 'whole', 'onion', 'finely diced', false, NULL),
  (rid, 6, 'Salsa', 2, 'whole', 'green chillies', 'finely chopped', false, NULL),
  (rid, 7, 'Salsa', 1, 'tbsp', 'vinegar', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the salsa', 'Combine the diced tomatoes, onion, green chillies, and vinegar in a bowl. Season with salt and mix well. Set aside to let the flavors meld.', NULL, NULL, 'Make the salsa first so it has time to develop flavor while you grill the meat.'),
  (rid, 2, 'Prepare the beef', 'Rub the beef strips with oil and season generously with salt. Let them come to room temperature for 10 minutes.', 600, 'Temper meat', NULL),
  (rid, 3, 'Grill the meat', 'Place the beef strips on a very hot grill or cast-iron pan. Cook for 2-3 minutes per side for medium, getting a good char on the outside while keeping the inside juicy.', 360, 'Grill', 'The grill or pan must be smoking hot for the best charred crust.'),
  (rid, 4, 'Slice and toss', 'Transfer the grilled beef to a cutting board. Slice into bite-sized pieces and toss with a generous spoonful of the fresh chilli salsa.', NULL, NULL, NULL),
  (rid, 5, 'Serve', 'Pile the kapana onto plates or into bread rolls. Serve immediately with extra salsa on the side.', NULL, NULL, 'At the market, kapana is served on newspaper or brown paper — keep it casual.');
END $$;

-- 9. Oshifima (Namibia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'oshifima-na', 'Oshifima', 'Oshifima / Pap',
    'A smooth, firm porridge made from pearl millet flour — the staple starch of northern Namibia, served with stews, greens, or grilled meat.',
    'NA', 'Namibia', 'Southern Africa', 'Owambo', 'side',
    ARRAY['staple','porridge','millet','owambo','everyday'],
    ARRAY['vegetarian','vegan','gluten-free','dairy-free','nut-free'],
    5, 20, 'easy', 6,
    'Oshifima is the daily bread of the Owambo people in northern Namibia, where pearl millet (mahangu) has been the principal crop for centuries. The dish is prepared by stirring millet flour into boiling water until it forms a thick, smooth mass. It is eaten with the hands — a small piece is pinched off, shaped into a scoop, and used to pick up stew or vegetables.',
    'Everyday staple', 'Oshikundu (fermented drink), stews, or grilled meat',
    280, 6, 62, 2, 4, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'pearl millet flour', 'mahangu flour', false, 'white maize meal'),
  (rid, 2, NULL, 1, 'litre', 'water', NULL, false, NULL),
  (rid, 3, NULL, 0.5, 'tsp', 'salt', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil water', 'Bring the water to a rolling boil in a heavy-bottomed pot. Add salt if using.', 300, 'Boil water', NULL),
  (rid, 2, 'Add millet flour gradually', 'Reduce heat to medium. Sprinkle in about a third of the millet flour while stirring constantly with a strong wooden spoon or oshini (wooden paddle) to prevent lumps.', 120, 'First addition', 'A flat wooden paddle gives you more leverage for stirring the thick porridge.'),
  (rid, 3, 'Build thickness', 'Continue adding the millet flour in batches, stirring vigorously after each addition. The mixture will become increasingly thick and heavy. Keep stirring to work out any lumps.', 600, 'Stir porridge', 'This requires real arm strength — the thicker it gets, the harder you stir.'),
  (rid, 4, 'Cook through', 'Once all the flour is incorporated and the mixture pulls away from the sides of the pot, reduce heat to low. Cover and steam for 5-8 minutes.', 480, 'Steam', NULL),
  (rid, 5, 'Shape and serve', 'Wet a wooden spoon and shape the oshifima into a smooth mound. Turn out onto a plate. Serve alongside stew, greens, or grilled meat.', NULL, NULL, 'Dip your hands in water when eating to prevent the oshifima from sticking to your fingers.');
END $$;

-- ===================
-- ZIMBABWE (ZW)
-- ===================

-- 10. Sadza neNyama (Zimbabwe)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'sadza-nenyama-zw', 'Sadza neNyama', NULL,
    'Zimbabwe''s cornerstone meal — thick maize porridge served with slow-cooked beef stew in a rich tomato and onion gravy, eaten with the hands.',
    'ZW', 'Zimbabwe', 'Southern Africa', 'Shona', 'main',
    ARRAY['national dish','sadza','beef stew','shona','staple','comfort food'],
    ARRAY['gluten-free','dairy-free','nut-free','halal'],
    15, 60, 'medium', 6,
    'No Zimbabwean meal is complete without sadza. This thick maize porridge is the foundation of nearly every meal, and the phrase "I haven''t eaten sadza today" is essentially saying you haven''t eaten at all. Paired with nyama (meat stew), it represents the quintessential Zimbabwean dining experience — always shared, always eaten by hand.',
    'Everyday family meal', 'Muriwo (cooked greens) and fresh vegetables',
    520, 30, 68, 14, 4, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Stew', 800, 'g', 'beef stewing meat', 'cubed', false, NULL),
  (rid, 2, 'Stew', 2, 'whole', 'onions', 'chopped', false, NULL),
  (rid, 3, 'Stew', 3, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 4, 'Stew', 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 5, 'Stew', 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 6, 'Stew', 500, 'ml', 'water', NULL, false, NULL),
  (rid, 7, 'Sadza', 500, 'g', 'white maize meal', 'finely ground', false, NULL),
  (rid, 8, 'Sadza', 1.2, 'litres', 'water', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the beef', 'Heat oil in a heavy pot over high heat. Brown the beef cubes in batches until well-seared. Remove and set aside.', 480, 'Brown beef', NULL),
  (rid, 2, 'Cook the stew base', 'In the same pot, fry the onions until golden. Add the tomatoes and cook until they form a thick sauce, about 8 minutes.', 480, 'Cook sauce', NULL),
  (rid, 3, 'Simmer the stew', 'Return the beef to the pot. Add water and salt. Bring to a boil, then reduce heat and simmer covered for 45 minutes until the beef is very tender and the gravy has thickened.', 2700, 'Simmer stew', 'The stew should be saucy but not watery — the gravy is meant to soak into the sadza.'),
  (rid, 4, 'Start the sadza', 'In a separate large pot, bring the water to a boil. Mix a cup of maize meal with cold water to form a thin paste. Pour this paste into the boiling water, stirring constantly. Cook for 5 minutes, stirring.', 300, 'Cook thin porridge', 'This first step creates a smooth base that prevents lumps.'),
  (rid, 5, 'Thicken the sadza', 'Gradually add the remaining maize meal, stirring vigorously with a wooden spoon after each addition. The sadza is ready when it is very thick and pulls away cleanly from the pot.', 600, 'Thicken sadza', 'Use a strong wooden spoon — a flat paddle called a mugoti works best.'),
  (rid, 6, 'Shape and serve', 'Wet a bowl and scoop sadza into it, pressing to form a smooth dome. Invert onto a plate. Serve alongside the beef stew and greens.', NULL, NULL, 'Pinch off a small piece of sadza, flatten it in your palm, and use it to scoop up the stew.');
END $$;

-- 11. Dovi (Zimbabwe)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'dovi-zw', 'Dovi', 'Dovi / Peanut Butter Stew',
    'A hearty Zimbabwean peanut butter stew with chicken and vegetables, rich and creamy with a deep nutty flavor — true comfort food from the heart of Zimbabwe.',
    'ZW', 'Zimbabwe', 'Southern Africa', 'Shona', 'stew',
    ARRAY['peanut butter','chicken','comfort food','shona','traditional'],
    ARRAY['gluten-free','dairy-free'],
    20, 50, 'medium', 6,
    'Dovi, meaning peanut butter in Shona, is one of Zimbabwe''s most cherished dishes. Peanuts have been cultivated in the region for centuries and peanut butter stew appears in various forms across the country. The dish is hearty, affordable, and incredibly satisfying — the peanut butter melts into the broth to create a thick, creamy sauce that coats every piece of chicken and vegetable.',
    'Family dinner', 'Sadza and fresh greens',
    480, 34, 18, 32, 4, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'kg', 'chicken pieces', 'skin on', false, 'beef or goat'),
  (rid, 2, NULL, 4, 'tbsp', 'peanut butter', 'smooth, natural', false, 'groundnut paste'),
  (rid, 3, NULL, 2, 'whole', 'onions', 'chopped', false, NULL),
  (rid, 4, NULL, 3, 'whole', 'tomatoes', 'chopped', false, NULL),
  (rid, 5, NULL, 2, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 6, NULL, 500, 'ml', 'water', NULL, false, NULL),
  (rid, 7, NULL, 200, 'g', 'pumpkin leaves or spinach', 'chopped', true, 'kale'),
  (rid, 8, NULL, 1, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the chicken', 'Heat oil in a large pot over medium-high heat. Season chicken pieces with salt and brown on all sides until golden. Remove and set aside.', 480, 'Brown chicken', NULL),
  (rid, 2, 'Cook onions and tomatoes', 'In the same pot, fry the onions until softened. Add the tomatoes and cook until they break down into a thick sauce, about 8 minutes.', 480, 'Cook base', NULL),
  (rid, 3, 'Dissolve the peanut butter', 'Mix the peanut butter with the water until smooth, ensuring there are no lumps. Pour this mixture into the pot with the tomato sauce and stir well.', NULL, NULL, 'Mixing the peanut butter with water separately first prevents clumping in the stew.'),
  (rid, 4, 'Simmer with chicken', 'Return the chicken to the pot. Bring to a gentle boil, then reduce heat to low. Cover and simmer for 35-40 minutes until the chicken is cooked through and the sauce is thick and creamy.', 2400, 'Simmer stew', 'Stir occasionally to prevent the peanut butter from sticking to the bottom.'),
  (rid, 5, 'Add greens', 'If using, add the pumpkin leaves or spinach in the last 10 minutes of cooking. Stir them into the stew and cook until wilted.', 600, 'Cook greens', NULL),
  (rid, 6, 'Serve', 'Adjust seasoning with salt. Serve hot with sadza, scooping up the thick peanut gravy with each bite.', NULL, NULL, 'The stew thickens as it cools — add a splash of water when reheating leftovers.');
END $$;

-- 12. Mapopo Candy (Zimbabwe)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'mapopo-candy-zw', 'Mapopo Candy', 'Mapopo',
    'Crystallized papaya pieces slow-cooked in sugar syrup until translucent and jewel-like — a traditional Zimbabwean sweet treat made from green papaya.',
    'ZW', 'Zimbabwe', 'Southern Africa', 'Shona', 'dessert',
    ARRAY['papaya','candy','traditional','sweet','preserving'],
    ARRAY['vegetarian','vegan','gluten-free','dairy-free','nut-free'],
    30, 90, 'medium', 8,
    'Mapopo candy is a treasured confection in Zimbabwe, passed down through generations of home cooks. Made from unripe green papaya that is peeled, sliced, and slowly candied in sugar syrup, the resulting translucent, jewel-toned sweets are a point of pride at church gatherings, weddings, and holiday celebrations. The process requires patience but the result is a unique treat found nowhere else.',
    'Special occasions and holidays', 'Tea',
    120, 0, 30, 0, 1, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'kg', 'green papaya', 'peeled, seeded, cut into 2cm cubes', false, NULL),
  (rid, 2, NULL, 500, 'g', 'white sugar', NULL, false, NULL),
  (rid, 3, NULL, 500, 'ml', 'water', NULL, false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'lemon juice', 'freshly squeezed', false, NULL),
  (rid, 5, NULL, 1, 'tsp', 'vanilla extract', NULL, true, NULL),
  (rid, 6, NULL, 3, 'drops', 'food coloring', 'red or green', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the papaya', 'Peel the green papaya, cut in half, and scoop out the seeds. Cut the flesh into 2cm cubes. Soak in salted water for 30 minutes, then drain and rinse well.', 1800, 'Soak papaya', 'The salt soak helps firm up the papaya so it holds its shape during cooking.'),
  (rid, 2, 'Pre-boil', 'Place the papaya cubes in a pot, cover with water, and boil for 10 minutes until slightly softened. Drain thoroughly.', 600, 'Pre-boil', NULL),
  (rid, 3, 'Make the syrup', 'In a clean pot, combine the sugar and water. Heat over medium, stirring until the sugar dissolves completely. Add lemon juice and food coloring if using.', 300, 'Make syrup', NULL),
  (rid, 4, 'Candy the papaya', 'Add the drained papaya cubes to the syrup. Bring to a gentle simmer and cook on low heat for 60-75 minutes, stirring very gently every 15 minutes, until the papaya turns translucent and the syrup thickens.', 4500, 'Candy', 'Do not stir too vigorously or the pieces will break apart.'),
  (rid, 5, 'Dry the candy', 'Using a slotted spoon, remove the candied papaya pieces and place on a wire rack or parchment paper. Let them dry for several hours or overnight until they develop a slightly firm, crystallized exterior.', NULL, NULL, 'In Zimbabwe, these are often dried in the sun for the best texture.'),
  (rid, 6, 'Store and serve', 'Once dried, toss lightly in extra sugar if desired. Store in an airtight container. Serve as a sweet snack with tea.', NULL, NULL, 'Mapopo candy keeps well for weeks in a cool, dry place.');
END $$;

-- ===================
-- LESOTHO (LS)
-- ===================

-- 13. Papa le Moroho (Lesotho)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'papa-le-moroho-ls', 'Papa le Moroho', NULL,
    'Lesotho''s everyday staple — thick maize meal porridge served with braised wild greens cooked with tomatoes and onions, a nourishing highland meal.',
    'LS', 'Lesotho', 'Southern Africa', 'Basotho', 'main',
    ARRAY['staple','maize','greens','basotho','everyday','highland'],
    ARRAY['vegetarian','vegan','gluten-free','dairy-free','nut-free'],
    10, 30, 'easy', 6,
    'Papa le moroho is the most fundamental meal in Lesotho, eaten daily in homes across the mountain kingdom. Papa (maize porridge) is the starchy base of nearly every Basotho meal, while moroho (wild greens) provides essential vitamins and minerals. In a country where much of the terrain is mountainous, these hardy crops and foraged greens have sustained the Basotho people for generations.',
    'Everyday meal', 'Chakalaka or stewed meat',
    310, 8, 58, 6, 7, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Papa', 400, 'g', 'white maize meal', NULL, false, NULL),
  (rid, 2, 'Papa', 1, 'litre', 'water', NULL, false, NULL),
  (rid, 3, 'Papa', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, 'Moroho', 500, 'g', 'wild spinach or Swiss chard', 'washed and chopped', false, 'regular spinach'),
  (rid, 5, 'Moroho', 2, 'whole', 'tomatoes', 'diced', false, NULL),
  (rid, 6, 'Moroho', 1, 'whole', 'onion', 'chopped', false, NULL),
  (rid, 7, 'Moroho', 1, 'tbsp', 'vegetable oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Start the papa', 'Bring the water to a boil in a heavy pot. Mix a quarter of the maize meal with cold water to make a thin paste. Stir this into the boiling water and cook for 5 minutes.', 300, 'Thin porridge', NULL),
  (rid, 2, 'Thicken the papa', 'Gradually add the remaining maize meal, stirring vigorously after each addition with a wooden spoon. Continue until the papa is very thick and pulls away from the sides of the pot. Cover and steam on low heat for 10 minutes.', 600, 'Steam papa', 'The key to good papa is vigorous stirring — it prevents lumps and creates a smooth texture.'),
  (rid, 3, 'Cook the moroho', 'While the papa steams, heat oil in a separate pan. Sauté the onion until softened. Add the tomatoes and cook until they form a sauce.', 300, 'Cook base', NULL),
  (rid, 4, 'Add greens', 'Add the chopped greens to the pan. Season with salt. Cover and cook for 8-10 minutes until the greens are tender and have absorbed the tomato flavor.', 600, 'Cook greens', 'Wild spinach takes longer to cook than regular spinach — adjust your timing accordingly.'),
  (rid, 5, 'Serve', 'Mound the papa on a serving plate. Spoon the moroho alongside. Eat by pinching off a piece of papa and using it to scoop up the greens.', NULL, NULL, 'In Basotho culture, meals are shared from a communal plate as a sign of unity.');
END $$;

-- 14. Motoho (Lesotho)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'motoho-ls', 'Motoho', 'Motoho / Fermented Sorghum Porridge',
    'A tangy, slightly sour fermented sorghum porridge — Lesotho''s traditional breakfast that warms the body against the cold highland mornings.',
    'LS', 'Lesotho', 'Southern Africa', 'Basotho', 'breakfast',
    ARRAY['fermented','sorghum','porridge','breakfast','traditional','highland'],
    ARRAY['vegetarian','vegan','gluten-free','dairy-free','nut-free'],
    15, 25, 'easy', 4,
    'Motoho is the traditional breakfast porridge of the Basotho, made from fermented sorghum or maize. The fermentation gives it a distinctive sour tang that Basotho people love. In the mountain kingdom where winter temperatures drop well below freezing, a bowl of warm motoho is the perfect start to the day, providing sustained energy for long hours of work.',
    'Breakfast', 'Sugar or honey and milk',
    220, 5, 48, 2, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 250, 'g', 'sorghum flour', NULL, false, 'millet flour'),
  (rid, 2, NULL, 1.5, 'litres', 'water', NULL, false, NULL),
  (rid, 3, NULL, 50, 'g', 'sorghum malt', 'ting or malted sorghum', false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'sugar', NULL, true, 'honey'),
  (rid, 5, NULL, 0.5, 'tsp', 'salt', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the base', 'Mix the sorghum flour with 500ml of cold water to form a smooth paste. Bring the remaining 1 litre of water to a boil in a pot.', NULL, NULL, NULL),
  (rid, 2, 'Cook the porridge', 'Gradually pour the sorghum paste into the boiling water, stirring constantly to prevent lumps. Reduce heat and simmer for 15 minutes, stirring frequently.', 900, 'Cook porridge', 'Keep stirring to prevent the porridge from catching on the bottom of the pot.'),
  (rid, 3, 'Add the malt', 'Remove from heat and let the porridge cool to lukewarm. Stir in the sorghum malt, mixing thoroughly. The malt will begin the fermentation process and thin the porridge slightly.', NULL, NULL, 'The porridge must be lukewarm, not hot, or the malt enzymes will be destroyed.'),
  (rid, 4, 'Ferment', 'Cover the pot and leave at room temperature overnight or for at least 8 hours. The porridge will develop a pleasant sour tang.', 28800, 'Ferment', 'In warmer weather, fermentation happens faster — check after 6 hours.'),
  (rid, 5, 'Reheat and serve', 'The next morning, gently reheat the motoho over low heat, stirring well. Add sugar or honey to taste. Serve warm in bowls, adding milk if desired.', 300, 'Reheat', 'The consistency should be pourable, like a thick smoothie — add water if too thick.');
END $$;

-- 15. Nyekoe (Lesotho)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'nyekoe-ls', 'Nyekoe', NULL,
    'A hearty Basotho bean and maize stew cooked together until thick and creamy — a protein-rich highland dish that fuels the people of the mountain kingdom.',
    'LS', 'Lesotho', 'Southern Africa', 'Basotho', 'stew',
    ARRAY['beans','maize','hearty','protein','traditional','highland'],
    ARRAY['vegetarian','vegan','gluten-free','dairy-free','nut-free'],
    20, 90, 'easy', 6,
    'Nyekoe is a simple but deeply satisfying combination of beans and maize kernels, slow-cooked until they merge into a thick, hearty stew. This dish has been a cornerstone of Basotho nutrition for centuries, providing essential protein and carbohydrates in a country where the harsh highland climate limits what can be grown. It is the kind of dish that grandmothers make and children remember forever.',
    'Everyday meal', 'Moroho (greens) and fresh milk',
    340, 16, 60, 4, 12, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 300, 'g', 'dried sugar beans', 'soaked overnight', false, 'kidney beans'),
  (rid, 2, NULL, 200, 'g', 'dried maize kernels', 'samp, soaked overnight', false, NULL),
  (rid, 3, NULL, 1, 'whole', 'onion', 'chopped', false, NULL),
  (rid, 4, NULL, 1.5, 'litres', 'water', NULL, false, NULL),
  (rid, 5, NULL, 1, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Soak overnight', 'Place the dried beans and samp in separate bowls, cover with water, and soak overnight or for at least 8 hours. Drain and rinse both.', NULL, NULL, 'Soaking significantly reduces cooking time and improves digestibility.'),
  (rid, 2, 'Start cooking', 'Place the drained samp in a large pot with 1.5 litres of water. Bring to a boil, then reduce heat and simmer for 30 minutes. Samp takes longer to cook than beans, so it gets a head start.', 1800, 'Cook samp', NULL),
  (rid, 3, 'Add beans', 'Add the drained beans and chopped onion to the pot with the samp. Add more water if needed to keep everything covered. Simmer for another 45-60 minutes until both the samp and beans are completely tender.', 3600, 'Cook beans and samp', 'Stir occasionally and add hot water as needed to prevent sticking.'),
  (rid, 4, 'Mash and season', 'Once everything is tender, use the back of a wooden spoon to roughly mash some of the beans against the side of the pot, creating a thick, creamy texture. Season with salt.', NULL, NULL, 'Do not mash everything — you want a mix of whole and broken beans for the best texture.'),
  (rid, 5, 'Serve', 'Ladle into bowls and serve hot. Nyekoe can be eaten on its own or alongside moroho and fresh milk.', NULL, NULL, 'Leftovers thicken overnight and are even better the next day.');
END $$;

-- ===================
-- ESWATINI (SZ)
-- ===================

-- 16. Sishwala with Emasi (Eswatini)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'sishwala-emasi-sz', 'Sishwala with Emasi', 'Sishwala neEmasi',
    'Eswatini''s national dish — thick maize porridge paired with emasi, a tangy fermented milk similar to sour cream, creating a perfect balance of starch and tang.',
    'SZ', 'Eswatini', 'Southern Africa', 'Swazi', 'main',
    ARRAY['national dish','maize','fermented milk','swazi','staple','traditional'],
    ARRAY['vegetarian','gluten-free','nut-free'],
    10, 25, 'easy', 6,
    'Sishwala with emasi is the most traditional meal in Eswatini, served at everything from daily meals to royal ceremonies. Emasi is a cherished fermented milk product made by curing fresh milk in a calabash gourd for several days. In Swazi culture, cattle represent wealth and emasi is considered a food of honor, traditionally served to guests and at important ceremonies.',
    'Daily meals and ceremonies', 'Stewed meat or vegetables',
    350, 12, 55, 10, 2, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Sishwala', 400, 'g', 'white maize meal', NULL, false, NULL),
  (rid, 2, 'Sishwala', 1, 'litre', 'water', NULL, false, NULL),
  (rid, 3, 'Sishwala', 0.5, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, 'Emasi', 500, 'ml', 'amasi or sour milk', NULL, false, 'thick plain yogurt or buttermilk');

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil water', 'Bring the water and salt to a boil in a heavy-bottomed pot.', 300, 'Boil water', NULL),
  (rid, 2, 'Make thin porridge', 'Mix about a quarter of the maize meal with a little cold water to form a paste. Stir this into the boiling water. Cook for 5 minutes, stirring constantly.', 300, 'Thin porridge', NULL),
  (rid, 3, 'Thicken', 'Gradually add the remaining maize meal in batches, stirring vigorously after each addition. Use a strong wooden spoon and put your weight into it — the porridge will become very thick and stiff.', 600, 'Thicken', 'The sishwala should be firmer than regular porridge — thick enough to hold its shape when scooped.'),
  (rid, 4, 'Steam', 'Reduce heat to very low. Cover the pot tightly and let the sishwala steam for 10-15 minutes until fully cooked.', 900, 'Steam', NULL),
  (rid, 5, 'Serve with emasi', 'Scoop the sishwala onto plates, forming a mound. Pour generous amounts of emasi over the top or serve it in a bowl on the side. The cool, tangy emasi complements the warm, bland sishwala perfectly.', NULL, NULL, 'Traditionally, emasi is served at room temperature, not chilled, to complement the warm sishwala.');
END $$;

-- 17. Incwancwa (Eswatini)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'incwancwa-sz', 'Incwancwa', NULL,
    'A tangy Swazi fermented maize porridge with a refreshing sour taste — served as a cooling, nutritious drink-like porridge often enjoyed during warm weather.',
    'SZ', 'Eswatini', 'Southern Africa', 'Swazi', 'drink',
    ARRAY['fermented','maize','porridge drink','traditional','refreshing','swazi'],
    ARRAY['vegetarian','vegan','gluten-free','dairy-free','nut-free'],
    15, 20, 'easy', 6,
    'Incwancwa is a traditional fermented maize porridge that the Swazi people have enjoyed for generations. Unlike thick sishwala, incwancwa is thin enough to drink and has a pleasant sour tang from natural fermentation. It is particularly popular during the hot summer months as a refreshing, energy-giving drink, and is commonly served at communal work parties and gatherings.',
    'Hot weather refreshment', 'Served as a standalone drink or light meal',
    190, 4, 42, 1, 3, true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 200, 'g', 'white maize meal', NULL, false, NULL),
  (rid, 2, NULL, 1.5, 'litres', 'water', NULL, false, NULL),
  (rid, 3, NULL, 50, 'g', 'sorghum malt', NULL, false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'sugar', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the porridge', 'Mix the maize meal with 500ml of cold water to form a smooth paste. Bring the remaining litre of water to a boil. Gradually stir the paste into the boiling water. Cook for 15 minutes, stirring frequently, until thickened.', 900, 'Cook porridge', NULL),
  (rid, 2, 'Cool down', 'Remove from heat and let the porridge cool to lukewarm. It should be warm to the touch but not hot.', 1200, 'Cool', 'The temperature is important — too hot and it will kill the fermenting agents.'),
  (rid, 3, 'Add malt and ferment', 'Stir in the sorghum malt until well combined. Cover with a clean cloth and leave at room temperature for 24-48 hours, stirring once or twice during this time.', NULL, NULL, 'The longer you ferment, the more sour it becomes — 24 hours gives a mild tang, 48 hours is more pronounced.'),
  (rid, 4, 'Strain and serve', 'Once fermented to your liking, stir well and add water to thin to a drinkable consistency. Add sugar to taste if desired. Serve at room temperature or slightly chilled.', NULL, NULL, 'Incwancwa should be the consistency of a thin smoothie — pourable but with some body.');
END $$;

-- 18. Umbhidvo Wetintsanga (Eswatini)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'umbhidvo-wetintsanga-sz', 'Umbhidvo Wetintsanga', NULL,
    'Tender pumpkin leaves cooked with crushed groundnuts — a beloved Swazi vegetable dish rich in protein and vitamins, traditionally foraged from the garden.',
    'SZ', 'Eswatini', 'Southern Africa', 'Swazi', 'side',
    ARRAY['pumpkin leaves','groundnuts','traditional','nutritious','swazi','vegetable'],
    ARRAY['vegetarian','vegan','gluten-free','dairy-free'],
    15, 25, 'easy', 4,
    'Umbhidvo wetintsanga is one of the most traditional Swazi dishes, made from the tender young leaves of the pumpkin plant combined with groundnuts. In Eswatini, nothing from the pumpkin plant goes to waste — the fruit, seeds, and leaves are all used in cooking. This dish represents the resourcefulness and deep agricultural knowledge of the Swazi people.',
    'Everyday side dish', 'Sishwala and stewed meat',
    195, 10, 14, 12, 5, true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'pumpkin leaves', 'young and tender, washed and chopped', false, 'sweet potato leaves or spinach'),
  (rid, 2, NULL, 100, 'g', 'raw groundnuts', 'shelled and coarsely crushed', false, 'peanuts'),
  (rid, 3, NULL, 1, 'whole', 'onion', 'chopped', false, NULL),
  (rid, 4, NULL, 2, 'whole', 'tomatoes', 'diced', false, NULL),
  (rid, 5, NULL, 1, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 6, NULL, 0.5, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare the leaves', 'Wash the pumpkin leaves thoroughly. Remove any tough stems and chop the leaves into pieces. Blanch in boiling water for 3 minutes, then drain.', 180, 'Blanch leaves', 'Blanching removes the slight bitterness from the leaves and softens the fine hairs on them.'),
  (rid, 2, 'Crush the groundnuts', 'Place the shelled groundnuts in a mortar and pound until coarsely crushed — they should be broken but not turned into powder.', NULL, NULL, 'You want a coarse texture that adds crunch to the finished dish.'),
  (rid, 3, 'Sauté the base', 'Heat oil in a pot over medium heat. Cook the onion until softened, then add the tomatoes and cook until they break down, about 5 minutes.', 300, 'Cook base', NULL),
  (rid, 4, 'Cook with groundnuts', 'Add the blanched pumpkin leaves and crushed groundnuts to the pot. Stir well, season with salt, cover, and cook for 15 minutes until the leaves are very tender and the groundnuts have released their oils into the dish.', 900, 'Cook together', 'Stir occasionally to prevent sticking, adding a splash of water if it becomes too dry.'),
  (rid, 5, 'Serve', 'Serve warm alongside sishwala and stewed meat for a complete traditional Swazi meal.', NULL, NULL, 'The groundnuts should be soft but still have some texture when the dish is ready.');
END $$;
