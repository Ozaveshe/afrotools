-- AfroKitchen Seed Data — Batch 3: North Africa
-- 7 countries × 3 recipes = 21 recipes

-- =============================================
-- MOROCCO (MA)
-- =============================================

-- 1. Chicken Tagine with Preserved Lemons (Morocco)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'chicken-tagine-preserved-lemons-ma', 'Chicken Tagine with Preserved Lemons & Olives', 'طاجين الدجاج بالحامض مرقد والزيتون', 'A fragrant Moroccan slow-cooked chicken stew with golden preserved lemons and briny olives, perfumed with saffron, ginger, and fresh cilantro.',
    'MA', 'Morocco', 'North Africa', 'Arab-Berber', 'main',
    ARRAY['tagine', 'chicken', 'slow-cooked', 'moroccan', 'one-pot'],
    ARRAY['gluten-free', 'dairy-free', 'halal'],
    30, 75, 'medium', 6,
    'The tagine is both a cooking vessel and the dish itself, central to Moroccan culinary identity for centuries. This particular combination of preserved lemons and olives is considered the quintessential Moroccan tagine, served at family lunches across the kingdom from Fez to Marrakech. The conical lid traps steam and returns it to the dish, creating tender meat in a concentrated sauce.',
    'Friday family lunch', 'Fluffy couscous or crusty Moroccan bread (khobz)',
    480, 38, 12, 28, 3,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 1, 'whole', 'chicken', 'cut into 8 pieces (about 1.5kg)', false, NULL),
  (rid, 2, NULL, 2, 'whole', 'preserved lemons', 'pulp discarded, rind sliced', false, NULL),
  (rid, 3, NULL, 1, 'cup', 'green olives', 'rinsed', false, 'mixed olives'),
  (rid, 4, NULL, 2, 'large', 'onions', 'grated', false, NULL),
  (rid, 5, NULL, 3, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 6, NULL, 0.5, 'tsp', 'saffron threads', 'soaked in 2 tbsp warm water', false, NULL),
  (rid, 7, NULL, 1, 'tsp', 'ground ginger', NULL, false, NULL),
  (rid, 8, NULL, 0.5, 'cup', 'fresh cilantro', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Marinate the chicken', 'Rub the chicken pieces with garlic, ginger, saffron water, salt, and pepper. Let marinate for at least 30 minutes or overnight in the fridge.', 1800, 'Marinate', 'Overnight marinating gives the deepest flavour.'),
  (rid, 2, 'Build the base', 'Place the grated onions in the bottom of a tagine or heavy-bottomed pot. Arrange the chicken on top and pour over any remaining marinade. Add 1 cup of water.', NULL, NULL, NULL),
  (rid, 3, 'Slow cook', 'Cover and cook over medium-low heat for about 60 minutes, turning the chicken once halfway through, until the meat is very tender and the sauce has reduced.', 3600, 'Slow cook chicken', 'Keep the heat low to prevent burning — the onions should melt into the sauce.'),
  (rid, 4, 'Add lemons and olives', 'Add the preserved lemon rinds and olives to the tagine. Cook uncovered for another 15 minutes to let the sauce thicken and the flavours meld.', 900, 'Finish tagine', NULL),
  (rid, 5, 'Garnish and serve', 'Arrange the chicken on a serving platter, spoon the sauce over the top, and garnish generously with fresh cilantro. Serve with couscous or bread.', NULL, NULL, 'Present in the tagine pot for an authentic table centrepiece.');
END $$;

-- 2. Harira (Morocco)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'harira-ma', 'Harira', 'الحريرة', 'A hearty Moroccan tomato and lentil soup thickened with flour and brightened with lemon juice, herbs, and warming spices. A staple during Ramadan to break the fast.',
    'MA', 'Morocco', 'North Africa', 'Arab-Berber', 'soup',
    ARRAY['ramadan', 'lentils', 'tomato', 'moroccan', 'soup'],
    ARRAY['halal', 'dairy-free'],
    20, 60, 'easy', 8,
    'Harira is the soul of Moroccan Ramadan. As the call to prayer sounds at sunset, families across the country break their fast with a steaming bowl of this nourishing soup, often accompanied by dates, chebakia pastries, and hard-boiled eggs. Each family has their own recipe, passed down through generations, but the tomato-lentil-chickpea base remains constant.',
    'Ramadan iftar', 'Dates, chebakia pastries, and crusty bread',
    320, 18, 42, 8, 10,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 250, 'g', 'lamb shoulder', 'cut into small cubes', false, 'beef chuck'),
  (rid, 2, NULL, 1, 'cup', 'brown lentils', 'rinsed', false, NULL),
  (rid, 3, NULL, 1, 'cup', 'chickpeas', 'soaked overnight and drained', false, 'canned chickpeas'),
  (rid, 4, NULL, 400, 'g', 'canned crushed tomatoes', NULL, false, NULL),
  (rid, 5, NULL, 1, 'large', 'onion', 'finely diced', false, NULL),
  (rid, 6, NULL, 0.5, 'cup', 'fresh cilantro', 'chopped', false, NULL),
  (rid, 7, NULL, 0.5, 'cup', 'fresh parsley', 'chopped', false, NULL),
  (rid, 8, NULL, 2, 'tbsp', 'plain flour', 'mixed with 0.5 cup water', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the meat', 'In a large pot, brown the lamb cubes in a drizzle of olive oil over medium-high heat until golden on all sides, about 5 minutes.', 300, 'Brown meat', NULL),
  (rid, 2, 'Sautee aromatics', 'Add the onion and cook until softened, about 4 minutes. Stir in 1 tsp each of ground ginger, turmeric, cinnamon, and black pepper.', 240, 'Cook onion', NULL),
  (rid, 3, 'Simmer the soup', 'Add the crushed tomatoes, lentils, soaked chickpeas, and 8 cups of water. Bring to a boil, then reduce to a gentle simmer. Cover and cook for 50 minutes until the lentils and chickpeas are tender.', 3000, 'Simmer soup', 'If using canned chickpeas, add them in the last 15 minutes.'),
  (rid, 4, 'Thicken the soup', 'Stir the flour-water mixture into the soup to thicken it. Add the cilantro and parsley. Simmer for another 10 minutes, stirring occasionally.', 600, 'Thicken', 'The soup should coat the back of a spoon.'),
  (rid, 5, 'Season and serve', 'Squeeze in the juice of one lemon, taste and adjust salt. Ladle into bowls and serve immediately with dates and bread.', NULL, NULL, 'A squeeze of fresh lemon just before serving brightens the whole bowl.');
END $$;

-- 3. Moroccan Msemen (Morocco)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'msemen-ma', 'Msemen', 'المسمن', 'Crispy, flaky Moroccan square flatbread made by folding layers of semolina dough with butter. Golden and crunchy on the outside, soft and chewy within.',
    'MA', 'Morocco', 'North Africa', 'Arab-Berber', 'breakfast',
    ARRAY['flatbread', 'breakfast', 'street-food', 'moroccan'],
    ARRAY['vegetarian', 'halal'],
    40, 20, 'medium', 8,
    'Msemen is a morning ritual across Morocco, sold on every street corner alongside mint tea. Mothers teach daughters the folding technique, a rhythmic motion of stretching, buttering, and folding the dough into its signature square shape. Whether enjoyed plain with honey or stuffed with a spiced onion-tomato filling, msemen represents the warmth of a Moroccan breakfast.',
    'Breakfast or tea time', 'Mint tea, honey, and soft cheese',
    280, 6, 38, 12, 2,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'all-purpose flour', NULL, false, NULL),
  (rid, 2, NULL, 1, 'cup', 'fine semolina', NULL, false, NULL),
  (rid, 3, NULL, 1, 'tsp', 'salt', NULL, false, NULL),
  (rid, 4, NULL, 1, 'tsp', 'sugar', NULL, false, NULL),
  (rid, 5, NULL, 0.5, 'tsp', 'dry yeast', NULL, false, NULL),
  (rid, 6, NULL, 1, 'cup', 'warm water', 'approximately', false, NULL),
  (rid, 7, NULL, 0.5, 'cup', 'softened butter', 'mixed with 2 tbsp vegetable oil', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the dough', 'Combine the flour, semolina, salt, sugar, and yeast. Gradually add warm water and knead for 10 minutes until you have a smooth, slightly sticky dough.', 600, 'Knead dough', 'The dough should be softer than bread dough — slightly sticky is perfect.'),
  (rid, 2, 'Rest the dough', 'Divide the dough into 8 equal balls. Oil each ball lightly and place on an oiled surface. Cover and let rest for 20 minutes.', 1200, 'Rest dough', NULL),
  (rid, 3, 'Shape the msemen', 'Take a ball and flatten it on an oiled surface, stretching it as thin as possible with your fingers. Spread softened butter across the surface. Fold the left and right edges to the centre, then fold the top and bottom edges to form a square. Repeat for all balls.', NULL, NULL, 'Work on an oiled surface to prevent sticking. The thinner you stretch, the flakier the layers.'),
  (rid, 4, 'Cook on griddle', 'Heat a flat griddle or skillet over medium heat. Place a msemen square on the dry griddle and cook for 2-3 minutes per side until golden brown and crispy.', 300, 'Cook each msemen', 'Press gently with a spatula while cooking to ensure even browning.'),
  (rid, 5, 'Serve warm', 'Serve the msemen warm, drizzled with honey or alongside soft cheese and mint tea.', NULL, NULL, 'Msemen are best eaten immediately while the layers are still crispy.');
END $$;

-- =============================================
-- ALGERIA (DZ)
-- =============================================

-- 4. Couscous Royal (Algeria)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'couscous-royal-dz', 'Couscous Royal', 'كسكسي ملكي', 'Algeria''s grandest couscous dish featuring fluffy steamed semolina topped with lamb, merguez sausage, and a fragrant vegetable broth loaded with chickpeas, turnips, and courgettes.',
    'DZ', 'Algeria', 'North Africa', 'Arab-Berber', 'main',
    ARRAY['couscous', 'lamb', 'algerian', 'festive', 'one-pot'],
    ARRAY['dairy-free', 'halal'],
    30, 90, 'hard', 8,
    'Couscous is inscribed on UNESCO''s Intangible Cultural Heritage list, shared among the Maghreb nations. In Algeria, Friday couscous is a sacred family tradition. The Royal version brings together multiple meats and a rich vegetable broth, reserved for celebrations, weddings, and honoured guests. Steaming the couscous in a couscoussier above the simmering broth infuses every grain with flavour.',
    'Friday lunch, weddings, celebrations', 'Buttermilk (lben) and harissa on the side',
    620, 35, 65, 22, 9,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Broth', 500, 'g', 'lamb shoulder', 'cut into large chunks', false, NULL),
  (rid, 2, 'Broth', 4, 'whole', 'merguez sausages', NULL, false, NULL),
  (rid, 3, 'Broth', 2, 'medium', 'turnips', 'peeled and quartered', false, NULL),
  (rid, 4, 'Broth', 2, 'medium', 'courgettes', 'cut into chunks', false, NULL),
  (rid, 5, 'Broth', 3, 'medium', 'carrots', 'peeled and halved', false, NULL),
  (rid, 6, 'Broth', 1, 'cup', 'chickpeas', 'soaked overnight', false, 'canned chickpeas'),
  (rid, 7, 'Broth', 2, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 8, 'Couscous', 500, 'g', 'medium couscous', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Start the broth', 'In the bottom of a couscoussier or large pot, brown the lamb in oil. Add the onion, tomato paste, 1 tsp each of ras el hanout, black pepper, and salt. Cover with 2 litres of water and bring to a boil. Reduce heat and simmer for 45 minutes.', 2700, 'Simmer lamb', 'Skim any foam that rises to the surface for a clear broth.'),
  (rid, 2, 'Add vegetables', 'Add the chickpeas, turnips, and carrots to the broth. Continue simmering for 20 minutes. Then add the courgettes and cook for another 15 minutes until all vegetables are tender.', 2100, 'Cook vegetables', 'Add vegetables in stages so nothing overcooks.'),
  (rid, 3, 'Steam the couscous', 'While the broth simmers, place the couscous in a wide bowl. Sprinkle with salted water and rake with your fingers. Transfer to the steamer basket and steam over the broth for 20 minutes. Remove, fluff, and repeat the process once more.', 2400, 'Steam couscous', 'Steaming twice gives the lightest, fluffiest couscous. Never let the couscous touch the broth directly.'),
  (rid, 4, 'Cook the merguez', 'Grill or pan-fry the merguez sausages until cooked through and charred on the outside, about 8 minutes.', 480, 'Cook merguez', NULL),
  (rid, 5, 'Assemble and serve', 'Mound the couscous on a large serving platter. Arrange the lamb and merguez on top. Surround with the vegetables and ladle broth over everything. Serve with harissa on the side.', NULL, NULL, 'Serve the extra broth in a separate bowl so guests can add more to their liking.');
END $$;

-- 5. Chakhchoukha (Algeria)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'chakhchoukha-dz', 'Chakhchoukha', 'شخشوخة', 'A rustic Algerian dish of hand-torn flatbread soaked in a rich, spiced tomato and lamb stew with chickpeas. A beloved comfort food from the eastern highlands.',
    'DZ', 'Algeria', 'North Africa', 'Chaoui', 'stew',
    ARRAY['algerian', 'lamb', 'flatbread', 'comfort-food', 'highlands'],
    ARRAY['dairy-free', 'halal'],
    25, 70, 'medium', 6,
    'Chakhchoukha hails from the Aures mountains and the high plateaux of eastern Algeria, particularly the cities of Biskra and Batna. It is the pride of the Chaoui Berber people. The dish gets its name from the sound of tearing the rougag flatbread into small pieces. Families prepare it for religious holidays, particularly Eid and Mawlid, gathering around a communal platter.',
    'Eid, Mawlid, family gatherings', 'Buttermilk (lben)',
    510, 30, 48, 20, 7,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Stew', 500, 'g', 'lamb', 'cut into pieces', false, 'chicken'),
  (rid, 2, 'Stew', 1, 'cup', 'chickpeas', 'soaked overnight', false, NULL),
  (rid, 3, 'Stew', 2, 'large', 'onions', 'finely chopped', false, NULL),
  (rid, 4, 'Stew', 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 5, 'Stew', 1, 'tsp', 'ras el hanout', NULL, false, NULL),
  (rid, 6, 'Stew', 1, 'tsp', 'dried chilli flakes', NULL, false, NULL),
  (rid, 7, 'Flatbread', 2, 'cups', 'fine semolina', NULL, false, NULL),
  (rid, 8, 'Flatbread', 0.5, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the rougag', 'Mix semolina with salt and enough water to form a smooth dough. Roll very thin and cook on a dry griddle until lightly spotted. Tear into small bite-sized pieces and set aside.', NULL, NULL, 'The flatbread should be paper-thin for the best texture.'),
  (rid, 2, 'Start the stew', 'In a large pot, heat oil and brown the lamb pieces on all sides. Add onions and cook until softened, about 5 minutes.', 300, 'Brown meat', NULL),
  (rid, 3, 'Build the sauce', 'Add tomato paste, ras el hanout, chilli flakes, salt, and pepper. Stir well. Add the chickpeas and enough water to cover. Bring to a boil, then reduce heat, cover, and simmer for 60 minutes until the lamb is very tender.', 3600, 'Simmer stew', 'The sauce should be thick and rich — reduce uncovered for the last 10 minutes if needed.'),
  (rid, 4, 'Assemble', 'Place the torn flatbread pieces in a large serving dish. Ladle the hot stew and sauce over the bread, ensuring every piece is well soaked.', NULL, NULL, 'Let the bread absorb the sauce for a few minutes before serving.'),
  (rid, 5, 'Steam and serve', 'Cover the dish and let it sit for 5 minutes so the bread absorbs the broth. Serve on a communal platter with the meat arranged on top.', 300, 'Rest', 'Traditionally eaten with spoons from a shared platter.');
END $$;

-- 6. Makroud (Algeria)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'makroud-dz', 'Makroud', 'المقروض', 'Diamond-shaped semolina pastries filled with fragrant date paste and deep-fried until golden, then dipped in warm honey syrup. A treasured Algerian sweet.',
    'DZ', 'Algeria', 'North Africa', 'Arab-Berber', 'dessert',
    ARRAY['pastry', 'dates', 'honey', 'algerian', 'fried'],
    ARRAY['vegetarian', 'dairy-free', 'halal'],
    45, 25, 'hard', 12,
    'Makroud is the jewel of Algerian patisserie, particularly associated with the city of Kairouan and the southern oasis towns. Every household prepares trays of makroud for Eid celebrations, weddings, and to welcome guests. The art lies in achieving the perfect ratio of crispy semolina shell to soft, spiced date filling, all glistening with honey.',
    'Eid, weddings, celebrations', 'Mint tea or Arabic coffee',
    220, 3, 32, 10, 2,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Dough', 3, 'cups', 'fine semolina', NULL, false, NULL),
  (rid, 2, 'Dough', 0.5, 'cup', 'melted butter', NULL, false, NULL),
  (rid, 3, 'Dough', 1, 'tbsp', 'orange blossom water', NULL, false, NULL),
  (rid, 4, 'Filling', 500, 'g', 'pitted dates', 'soft variety like Deglet Noor', false, NULL),
  (rid, 5, 'Filling', 1, 'tsp', 'ground cinnamon', NULL, false, NULL),
  (rid, 6, 'Filling', 1, 'tbsp', 'orange blossom water', NULL, false, NULL),
  (rid, 7, 'Syrup', 1, 'cup', 'honey', NULL, false, NULL),
  (rid, 8, 'Frying', 3, 'cups', 'vegetable oil', 'for deep frying', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the date filling', 'Process the dates with cinnamon and orange blossom water until you have a smooth, thick paste. Roll into long logs about 1.5cm in diameter. Set aside.', NULL, NULL, 'If dates are dry, add a tablespoon of warm water while processing.'),
  (rid, 2, 'Prepare the dough', 'Combine semolina with melted butter, orange blossom water, a pinch of salt, and enough warm water to form a firm but pliable dough. Knead for 5 minutes.', 300, 'Knead dough', 'The dough should hold together without being sticky.'),
  (rid, 3, 'Shape the makroud', 'Divide dough into portions. Roll each into a log and make a groove down the centre. Place a date paste log inside and seal the dough around it. Flatten slightly and cut into diamond shapes.', NULL, NULL, 'Use a fork to press a decorative pattern on each piece.'),
  (rid, 4, 'Fry until golden', 'Heat oil to 170C (340F). Fry the makroud in batches for 3-4 minutes, turning once, until deep golden brown. Drain on paper towels.', 240, 'Fry makroud', 'Do not overcrowd the pan — fry in small batches for even cooking.'),
  (rid, 5, 'Dip in honey', 'Warm the honey gently. Dip each fried makroud into the warm honey, turning to coat all sides. Place on a rack to let excess honey drip off.', NULL, NULL, 'Warm honey coats more evenly than cold. Let them cool completely before storing.'),
  (rid, 6, 'Serve', 'Arrange on a platter and allow to cool completely. Makroud keep well in an airtight container for up to a week.', NULL, NULL, NULL);
END $$;

-- =============================================
-- TUNISIA (TN)
-- =============================================

-- 7. Lablabi (Tunisia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'lablabi-tn', 'Lablabi', 'لبلابي', 'Tunisia''s beloved chickpea soup poured over torn stale bread, loaded with harissa, cumin, garlic, and a drizzle of olive oil. A fiery, nourishing breakfast staple.',
    'TN', 'Tunisia', 'North Africa', 'Arab', 'breakfast',
    ARRAY['chickpea', 'soup', 'street-food', 'tunisian', 'spicy'],
    ARRAY['vegan', 'dairy-free', 'halal'],
    15, 45, 'easy', 4,
    'Lablabi is the ultimate Tunisian street food, served from early morning in small hole-in-the-wall shops across Tunis, Sousse, and Sfax. Workers and students line up for a warm bowl before starting their day. Each diner customises their bowl with as much harissa, cumin, capers, and olive oil as they like. It is simple, frugal cooking at its most satisfying — transforming humble chickpeas and stale bread into something extraordinary.',
    'Breakfast, cold winter mornings', 'Crusty bread, pickled turnips, and olives',
    380, 16, 48, 14, 12,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'dried chickpeas', 'soaked overnight', false, 'canned chickpeas'),
  (rid, 2, NULL, 4, 'cloves', 'garlic', 'crushed', false, NULL),
  (rid, 3, NULL, 2, 'tbsp', 'harissa paste', NULL, false, NULL),
  (rid, 4, NULL, 2, 'tsp', 'ground cumin', NULL, false, NULL),
  (rid, 5, NULL, 0.25, 'cup', 'extra virgin olive oil', NULL, false, NULL),
  (rid, 6, NULL, 0.5, 'loaf', 'stale crusty bread', 'torn into small pieces', false, NULL),
  (rid, 7, NULL, 2, 'tbsp', 'capers', NULL, true, NULL),
  (rid, 8, NULL, 1, 'whole', 'lemon', 'juiced', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the chickpeas', 'Drain the soaked chickpeas and place in a large pot. Cover with fresh water, add 1 tsp baking soda, and bring to a boil. Reduce heat and simmer for 40 minutes until very tender.', 2400, 'Cook chickpeas', 'The baking soda helps the chickpeas get extra soft and creamy.'),
  (rid, 2, 'Season the broth', 'Stir in the crushed garlic, harissa, cumin, salt, and pepper into the chickpea broth. Simmer for another 5 minutes to let the flavours infuse.', 300, 'Season broth', 'Adjust the harissa to your heat preference — Tunisians like it fiery.'),
  (rid, 3, 'Prepare the bowls', 'Place a generous handful of torn bread pieces in each serving bowl.', NULL, NULL, 'Day-old or stale bread works best as it absorbs the broth without disintegrating.'),
  (rid, 4, 'Assemble and serve', 'Ladle the hot chickpea broth and chickpeas over the bread. Drizzle generously with olive oil, squeeze lemon juice over the top, and scatter capers if using. Serve immediately.', NULL, NULL, 'Some like to crack a raw egg into the hot broth — the heat gently cooks it.');
END $$;

-- 8. Brik (Tunisia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'brik-tn', 'Brik a l''Oeuf', 'بريك بالعجين', 'A crispy Tunisian pastry turnover filled with a whole egg, tuna, capers, and parsley, fried until the paper-thin malsouka shell shatters at the first bite.',
    'TN', 'Tunisia', 'North Africa', 'Arab', 'snack',
    ARRAY['pastry', 'egg', 'tuna', 'fried', 'tunisian', 'street-food'],
    ARRAY['pescatarian', 'dairy-free', 'halal'],
    15, 10, 'medium', 4,
    'Brik is a Tunisian national treasure, particularly the classic version with a runny egg sealed inside a crispy malsouka (or warka) pastry. Eating brik is a test of skill — the goal is to bite in without the egg yolk dripping down your chin. It is a staple of Ramadan tables, street stalls, and family dinners across the country.',
    'Ramadan iftar, appetiser', 'Harissa sauce and lemon wedges',
    310, 18, 22, 16, 2,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 4, 'sheets', 'malsouka pastry', NULL, false, 'spring roll wrappers or filo'),
  (rid, 2, NULL, 4, 'whole', 'eggs', NULL, false, NULL),
  (rid, 3, NULL, 1, 'can', 'tuna in olive oil', 'drained and flaked', false, NULL),
  (rid, 4, NULL, 1, 'tbsp', 'capers', 'chopped', false, NULL),
  (rid, 5, NULL, 0.25, 'cup', 'fresh parsley', 'finely chopped', false, NULL),
  (rid, 6, NULL, 1, 'small', 'onion', 'finely diced and sauteed', false, NULL),
  (rid, 7, NULL, 3, 'cups', 'vegetable oil', 'for frying', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the filling base', 'Mix together the flaked tuna, sauteed onion, capers, parsley, salt, and pepper in a bowl.', NULL, NULL, NULL),
  (rid, 2, 'Assemble the brik', 'Lay a sheet of malsouka pastry on a flat surface. Spoon a quarter of the tuna mixture onto one half. Make a small well in the centre and crack a whole egg into it. Season the egg with salt and pepper.', NULL, NULL, 'Work quickly — the pastry dries out fast.'),
  (rid, 3, 'Fold and seal', 'Carefully fold the pastry over to form a half-moon shape, pressing the edges to seal. Be gentle so the egg yolk stays intact.', NULL, NULL, 'A dab of egg white along the edges helps seal the pastry.'),
  (rid, 4, 'Fry until golden', 'Heat oil in a deep skillet to 180C (355F). Carefully slide the brik into the hot oil and fry for about 1-2 minutes per side until deep golden and crispy.', 120, 'Fry brik', 'The egg should remain runny inside — do not overcook.'),
  (rid, 5, 'Drain and serve', 'Remove with a slotted spoon and drain briefly on paper towels. Serve immediately with lemon wedges and harissa.', NULL, NULL, 'Eat immediately — brik waits for no one.');
END $$;

-- 9. Tunisian Ojja (Tunisia)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'ojja-tn', 'Ojja with Merguez', 'عجة بالمرقاز', 'A spicy Tunisian egg and tomato skillet loaded with harissa, merguez sausage, and peppers. Tunisia''s answer to shakshuka, with a bolder, fierier personality.',
    'TN', 'Tunisia', 'North Africa', 'Arab', 'breakfast',
    ARRAY['eggs', 'merguez', 'harissa', 'tunisian', 'skillet', 'spicy'],
    ARRAY['gluten-free', 'halal'],
    10, 25, 'easy', 4,
    'Ojja is a staple of Tunisian home cooking, particularly popular as a quick lunch or brunch. Unlike its milder cousins across the Mediterranean, Tunisian ojja is unapologetically spicy thanks to a generous dose of harissa. The addition of merguez sausage makes it a hearty, satisfying one-pan meal that comes together in minutes.',
    'Brunch, quick lunch', 'Crusty baguette or tabbouna bread',
    420, 24, 14, 30, 4,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 4, 'whole', 'merguez sausages', 'sliced into rounds', false, NULL),
  (rid, 2, NULL, 4, 'whole', 'eggs', NULL, false, NULL),
  (rid, 3, NULL, 400, 'g', 'canned chopped tomatoes', NULL, false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'harissa paste', NULL, false, NULL),
  (rid, 5, NULL, 1, 'medium', 'green pepper', 'diced', false, NULL),
  (rid, 6, NULL, 2, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 7, NULL, 1, 'tsp', 'ground caraway', NULL, false, NULL),
  (rid, 8, NULL, 2, 'tbsp', 'olive oil', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the merguez', 'Heat olive oil in a deep skillet over medium heat. Add the merguez slices and cook until browned and slightly crispy, about 5 minutes. Remove and set aside.', 300, 'Brown merguez', NULL),
  (rid, 2, 'Build the sauce', 'In the same skillet, cook the green pepper and garlic for 2 minutes. Add the harissa, caraway, and a pinch of salt. Stir for 30 seconds until fragrant.', 150, 'Cook peppers', NULL),
  (rid, 3, 'Simmer tomatoes', 'Add the chopped tomatoes and simmer for 10 minutes until the sauce thickens and reduces. Return the merguez to the skillet.', 600, 'Simmer sauce', 'The sauce should be thick, not watery.'),
  (rid, 4, 'Add the eggs', 'Make 4 wells in the sauce and crack an egg into each. Cover the skillet and cook for 5-6 minutes until the egg whites are set but the yolks are still runny.', 360, 'Cook eggs', 'For set yolks, cook a minute or two longer with the lid on.'),
  (rid, 5, 'Serve in the skillet', 'Remove from heat and serve straight from the skillet with plenty of crusty bread for dipping.', NULL, NULL, 'Bring the skillet to the table for a rustic, communal meal.');
END $$;

-- =============================================
-- LIBYA (LY)
-- =============================================

-- 10. Bazin (Libya)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'bazin-ly', 'Bazin', 'بازين', 'Libya''s national dish — a smooth, dense dome of barley dough surrounded by a rich lamb and tomato stew, topped with hard-boiled eggs. Eaten communally by hand.',
    'LY', 'Libya', 'North Africa', 'Arab-Berber', 'main',
    ARRAY['barley', 'lamb', 'libyan', 'traditional', 'communal'],
    ARRAY['dairy-free', 'halal'],
    20, 90, 'hard', 6,
    'Bazin is the centrepiece of Libyan cuisine, a dish that defines national identity. The barley dough is cooked and pounded until smooth, then shaped into a dome and placed in the centre of a large round tray, surrounded by a slow-cooked lamb stew. Families gather around the tray and eat with their right hand, tearing off pieces of bazin and dipping them in the sauce. It is served at every major celebration and Friday lunch.',
    'Friday lunch, Eid, weddings', 'Hard-boiled eggs and fresh salad',
    550, 32, 55, 20, 8,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Stew', 500, 'g', 'lamb on the bone', 'cut into pieces', false, NULL),
  (rid, 2, 'Stew', 2, 'large', 'onions', 'diced', false, NULL),
  (rid, 3, 'Stew', 3, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 4, 'Stew', 2, 'tbsp', 'olive oil', NULL, false, NULL),
  (rid, 5, 'Stew', 1, 'tsp', 'turmeric', NULL, false, NULL),
  (rid, 6, 'Stew', 2, 'medium', 'potatoes', 'peeled and halved', false, NULL),
  (rid, 7, 'Dough', 2, 'cups', 'barley flour', NULL, false, NULL),
  (rid, 8, 'Garnish', 3, 'whole', 'eggs', 'hard-boiled and halved', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Start the stew', 'Heat olive oil in a large pot. Brown the lamb on all sides. Add onions and cook until golden. Stir in tomato paste, turmeric, salt, pepper, and 1 tsp cayenne. Add enough water to cover the meat generously.', 600, 'Brown lamb', NULL),
  (rid, 2, 'Simmer until tender', 'Bring to a boil, then reduce to a low simmer. Cover and cook for about 60 minutes. Add potatoes in the last 20 minutes. The lamb should be falling-off-the-bone tender and the sauce thick.', 3600, 'Simmer stew', 'The sauce needs to be rich and reduced — it is the dipping sauce for the bazin.'),
  (rid, 3, 'Make the bazin dough', 'Bring 3 cups of salted water to a boil. Gradually add the barley flour while stirring vigorously with a wooden spoon. Keep stirring and cooking over low heat for 15 minutes until you have a very thick, smooth dough that pulls away from the pot.', 900, 'Cook dough', 'Stir constantly and use muscle — the dough should be very thick and smooth.'),
  (rid, 4, 'Shape the dome', 'Wet your hands and shape the barley dough into a smooth dome. Place it in the centre of a large round serving tray.', NULL, NULL, 'Dip your hands in cold water to prevent sticking.'),
  (rid, 5, 'Assemble and serve', 'Arrange the lamb and potatoes around the bazin dome. Pour the stew sauce over and around it. Place the hard-boiled egg halves on top. Serve communally and eat by hand.', NULL, NULL, 'Tear small pieces of bazin and dip into the sauce — the combination is extraordinary.');
END $$;

-- 11. Sharba Libiya (Libya)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'sharba-libiya-ly', 'Sharba Libiya', 'شوربة ليبية', 'A warming Libyan lamb and orzo soup spiced with cinnamon, turmeric, and mint. A deeply comforting bowl often served to break the Ramadan fast.',
    'LY', 'Libya', 'North Africa', 'Arab', 'soup',
    ARRAY['soup', 'lamb', 'libyan', 'ramadan', 'orzo'],
    ARRAY['dairy-free', 'halal'],
    15, 55, 'easy', 6,
    'Sharba is the soup that greets every Libyan at the iftar table during Ramadan. Its fragrance fills Libyan kitchens in the late afternoon as families prepare for the evening meal. The combination of lamb, tomato, and small pasta with warm spices like cinnamon and mint is uniquely Libyan and instantly recognisable.',
    'Ramadan iftar', 'Crusty bread and dates',
    340, 22, 30, 14, 5,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 300, 'g', 'lamb shoulder', 'cut into small cubes', false, NULL),
  (rid, 2, NULL, 0.5, 'cup', 'orzo pasta', NULL, false, 'small pasta like ditalini'),
  (rid, 3, NULL, 2, 'tbsp', 'tomato paste', NULL, false, NULL),
  (rid, 4, NULL, 1, 'large', 'onion', 'finely diced', false, NULL),
  (rid, 5, NULL, 1, 'tsp', 'ground cinnamon', NULL, false, NULL),
  (rid, 6, NULL, 1, 'tsp', 'turmeric', NULL, false, NULL),
  (rid, 7, NULL, 1, 'tsp', 'dried mint', NULL, false, NULL),
  (rid, 8, NULL, 0.5, 'cup', 'fresh cilantro', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the lamb', 'Heat 2 tbsp olive oil in a large pot. Add the lamb cubes and brown on all sides, about 5 minutes. Remove and set aside.', 300, 'Brown lamb', NULL),
  (rid, 2, 'Build the base', 'Add the onion to the pot and cook until soft. Stir in tomato paste, cinnamon, turmeric, dried mint, salt, and pepper. Cook for 2 minutes until fragrant.', 120, 'Cook aromatics', NULL),
  (rid, 3, 'Simmer the soup', 'Return the lamb to the pot. Add 6 cups of water and bring to a boil. Reduce heat and simmer for 40 minutes until the lamb is very tender.', 2400, 'Simmer', 'Skim any foam for a clearer soup.'),
  (rid, 4, 'Add the pasta', 'Add the orzo to the soup and cook for 10-12 minutes until al dente. The soup should be slightly thick from the starch.', 720, 'Cook orzo', 'Add more water if the soup gets too thick — it should still be brothy.'),
  (rid, 5, 'Finish and serve', 'Stir in the fresh cilantro and a squeeze of lemon juice. Taste and adjust seasoning. Serve hot in deep bowls.', NULL, NULL, 'A drizzle of olive oil on top adds richness.');
END $$;

-- 12. Asida (Libya)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'asida-ly', 'Asida', 'عصيدة', 'A simple Libyan porridge-like dessert of wheat flour cooked into a smooth mound, served with a well of honey and melted butter in the centre. Sweet, warm, and ancient.',
    'LY', 'Libya', 'North Africa', 'Arab-Berber', 'dessert',
    ARRAY['dessert', 'libyan', 'honey', 'traditional', 'simple'],
    ARRAY['vegetarian', 'nut-free', 'halal'],
    5, 15, 'easy', 6,
    'Asida is one of the oldest desserts in North Africa, served in Libya to celebrate the birth of a child, during Mawlid (the Prophet''s birthday), and other joyful occasions. Its simplicity is its beauty — just flour, water, and butter, transformed through patient stirring into something comforting and celebratory. The crater of honey and butter in the centre is shared as everyone tears from the mound.',
    'Mawlid, births, celebrations', 'Mint tea',
    350, 5, 52, 14, 1,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'all-purpose flour', NULL, false, 'wheat flour'),
  (rid, 2, NULL, 3, 'cups', 'water', NULL, false, NULL),
  (rid, 3, NULL, 0.5, 'cup', 'honey', NULL, false, 'date syrup'),
  (rid, 4, NULL, 0.25, 'cup', 'butter', 'melted', false, NULL),
  (rid, 5, NULL, 0.25, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Boil the water', 'Bring 3 cups of water with a pinch of salt to a rolling boil in a heavy-bottomed pot.', NULL, NULL, NULL),
  (rid, 2, 'Add the flour', 'Reduce heat to low. Gradually add the flour while stirring vigorously and continuously with a strong wooden spoon. Keep stirring for about 10 minutes until the mixture forms a thick, smooth, elastic dough that pulls away from the sides of the pot.', 600, 'Cook asida', 'Stir with force — the dough needs to be completely lump-free and smooth.'),
  (rid, 3, 'Shape the asida', 'Wet a serving plate. Turn the asida out onto the plate and shape it into a smooth dome using a wet spoon or wet hands.', NULL, NULL, 'Wetting your tools prevents sticking.'),
  (rid, 4, 'Create the well', 'Make a deep well in the centre of the dome using the back of a spoon. Pour the melted butter into the well, then drizzle honey generously over the top.', NULL, NULL, 'The butter and honey pool should be generous — it is the soul of the dish.'),
  (rid, 5, 'Serve communally', 'Serve warm on a communal plate. Each person tears off a piece of the asida and dips it into the honey-butter well.', NULL, NULL, 'Asida is best eaten warm while the butter and honey are still flowing.');
END $$;

-- =============================================
-- EGYPT (EG)
-- =============================================

-- 13. Koshari (Egypt)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'koshari-eg', 'Koshari', 'كشري', 'Egypt''s iconic street food — layers of rice, lentils, macaroni, and chickpeas topped with a spiced tomato sauce, garlicky vinegar dressing, and shatteringly crispy fried onions.',
    'EG', 'Egypt', 'North Africa', 'Egyptian', 'main',
    ARRAY['street-food', 'lentils', 'rice', 'egyptian', 'carbs', 'vegan'],
    ARRAY['vegan', 'dairy-free', 'halal'],
    20, 50, 'medium', 6,
    'Koshari is the undisputed national dish of Egypt, sold from carts and dedicated shops on every street in Cairo, Alexandria, and beyond. Originally a humble dish of the working class, it has become a symbol of Egyptian identity. The magic is in the layering — each component is simple, but together with the tangy tomato sauce and crispy onions, koshari becomes greater than the sum of its parts.',
    'Everyday lunch, street food', 'Extra crispy onions and hot sauce',
    520, 18, 85, 10, 12,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Base', 1, 'cup', 'Egyptian rice', 'rinsed', false, 'short-grain rice'),
  (rid, 2, 'Base', 1, 'cup', 'brown lentils', 'rinsed', false, NULL),
  (rid, 3, 'Base', 1, 'cup', 'elbow macaroni', NULL, false, NULL),
  (rid, 4, 'Base', 1, 'cup', 'canned chickpeas', 'drained', false, NULL),
  (rid, 5, 'Tomato sauce', 400, 'g', 'crushed tomatoes', NULL, false, NULL),
  (rid, 6, 'Tomato sauce', 2, 'tsp', 'white vinegar', NULL, false, NULL),
  (rid, 7, 'Topping', 3, 'large', 'onions', 'thinly sliced into rings', false, NULL),
  (rid, 8, 'Dakka', 6, 'cloves', 'garlic', 'minced', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the lentils', 'Boil the brown lentils in salted water for about 20 minutes until tender but still holding their shape. Drain and set aside.', 1200, 'Cook lentils', 'Do not overcook — the lentils should keep their shape.'),
  (rid, 2, 'Cook rice and pasta', 'Cook the rice according to package directions. Separately, boil the macaroni until al dente. Drain both and set aside.', 1200, 'Cook rice & pasta', NULL),
  (rid, 3, 'Fry the onions', 'Thinly slice the onions and deep-fry in batches in vegetable oil until deeply golden and crispy, about 8 minutes per batch. Drain on paper towels.', 480, 'Fry onions', 'Fry low and slow for the crispiest onions — they will darken as they cool.'),
  (rid, 4, 'Make the tomato sauce', 'In a saucepan, saute a little garlic in oil, then add crushed tomatoes, vinegar, 1 tsp cumin, salt, and a pinch of chilli. Simmer for 15 minutes.', 900, 'Tomato sauce', NULL),
  (rid, 5, 'Make the dakka', 'In a small pan, fry the remaining garlic in 2 tbsp oil until golden. Add 3 tbsp white vinegar and 1 tsp cumin. Let it sizzle for 30 seconds.', NULL, NULL, 'The dakka should be sharp and garlicky.'),
  (rid, 6, 'Assemble and serve', 'Layer the rice, lentils, and macaroni in a deep bowl. Top with chickpeas, pour over the tomato sauce and dakka, then pile the crispy onions on top. Serve immediately.', NULL, NULL, 'The layers should be visible — do not mix before serving.');
END $$;

-- 14. Ful Medames (Egypt)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'ful-medames-eg', 'Ful Medames', 'فول مدمس', 'Slow-cooked fava beans mashed with garlic, lemon, and cumin, drizzled with olive oil and served with warm pita. Egypt''s beloved everyday breakfast.',
    'EG', 'Egypt', 'North Africa', 'Egyptian', 'breakfast',
    ARRAY['fava-beans', 'breakfast', 'egyptian', 'street-food', 'protein'],
    ARRAY['vegan', 'gluten-free', 'dairy-free', 'halal'],
    10, 30, 'easy', 4,
    'Ful medames may be the oldest dish still eaten in Egypt, tracing back to the pharaohs. Today it is the breakfast of millions — from street vendors serving it in paper-lined bowls at dawn to families enjoying it around the kitchen table. The word medames means buried, referring to the ancient practice of slow-cooking the beans in a pot buried in hot embers overnight. The ful cart is an institution in every Egyptian neighbourhood.',
    'Daily breakfast', 'Warm pita bread, pickled turnips, and fresh vegetables',
    290, 16, 36, 10, 14,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'cups', 'dried fava beans', 'soaked overnight', false, 'canned fava beans'),
  (rid, 2, NULL, 4, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 3, NULL, 2, 'whole', 'lemons', 'juiced', false, NULL),
  (rid, 4, NULL, 2, 'tsp', 'ground cumin', NULL, false, NULL),
  (rid, 5, NULL, 0.25, 'cup', 'extra virgin olive oil', NULL, false, NULL),
  (rid, 6, NULL, 0.5, 'cup', 'fresh parsley', 'chopped', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the beans', 'Drain the soaked fava beans, place in a large pot, and cover with fresh water. Bring to a boil, then reduce heat and simmer for about 1 hour until the beans are very soft and creamy. Reserve some cooking liquid before draining.', 3600, 'Cook beans', 'For an authentic texture, some beans should be falling apart while others stay whole.'),
  (rid, 2, 'Mash and season', 'Partially mash the beans with a fork or potato masher, leaving some whole for texture. Add garlic, cumin, lemon juice, and salt. Stir well, adding cooking liquid as needed to reach your desired consistency.', NULL, NULL, 'The ful should be creamy but not a smooth puree — texture is key.'),
  (rid, 3, 'Warm through', 'Return the mashed beans to low heat and warm through for 5 minutes, stirring gently to let the garlic and cumin infuse.', 300, 'Warm ful', NULL),
  (rid, 4, 'Serve', 'Spoon into shallow bowls. Drizzle generously with olive oil, sprinkle with cumin and parsley, and serve with warm pita bread, pickled turnips, and sliced tomatoes.', NULL, NULL, 'Every diner should customise their bowl with extra lemon, cumin, or chilli to taste.');
END $$;

-- 15. Molokhia (Egypt)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'molokhia-eg', 'Molokhia', 'ملوخية', 'A vibrant green soup made from finely chopped jute leaves simmered in chicken broth, finished with a sizzling garlic and coriander dressing. Egypt''s most iconic home-cooked meal.',
    'EG', 'Egypt', 'North Africa', 'Egyptian', 'soup',
    ARRAY['jute-leaves', 'chicken', 'egyptian', 'soup', 'garlic'],
    ARRAY['gluten-free', 'dairy-free', 'halal'],
    20, 40, 'medium', 6,
    'Molokhia has been eaten in Egypt for thousands of years, with roots in the pharaonic era. The name comes from the Arabic word for kings — legend says it was once reserved for royalty. The signature moment is the tash-a — a sizzle of garlic and ground coriander fried in ghee and stirred into the pot, releasing an unmistakable aroma that signals dinner is ready in Egyptian households.',
    'Everyday family dinner', 'White rice and roasted chicken',
    280, 22, 18, 14, 6,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'molokhia leaves', 'fresh or frozen, finely chopped', false, NULL),
  (rid, 2, NULL, 1, 'litre', 'chicken broth', 'rich and homemade', false, NULL),
  (rid, 3, NULL, 8, 'cloves', 'garlic', 'minced', false, NULL),
  (rid, 4, NULL, 2, 'tbsp', 'ground coriander', NULL, false, NULL),
  (rid, 5, NULL, 3, 'tbsp', 'ghee', NULL, false, 'butter'),
  (rid, 6, NULL, 1, 'whole', 'chicken', 'poached (from making the broth)', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the broth', 'Poach a whole chicken in water with an onion, bay leaves, and cardamom pods for about 40 minutes until cooked through. Remove the chicken and strain the broth. Shred the chicken meat and set aside.', 2400, 'Poach chicken', 'A rich, flavourful broth is the foundation — do not skip the aromatics.'),
  (rid, 2, 'Cook the molokhia', 'Bring the chicken broth to a boil. Add the finely chopped molokhia leaves and stir well. Reduce heat and simmer for 10 minutes, stirring occasionally. The soup should be thick and slightly viscous.', 600, 'Simmer molokhia', 'Never cover the pot while cooking molokhia — it can turn the leaves brown.'),
  (rid, 3, 'Prepare the tash-a', 'In a small pan, heat the ghee until very hot. Add the garlic and fry until golden, about 30 seconds. Add the ground coriander and stir for 10 seconds until fragrant — it should sizzle vigorously.', NULL, NULL, 'Watch carefully — the garlic burns quickly. It should be golden, not brown.'),
  (rid, 4, 'Finish the soup', 'Pour the sizzling tash-a directly into the molokhia pot. Stir well — it will bubble dramatically. This is the moment that defines Egyptian molokhia.', NULL, NULL, 'The dramatic sizzle when the garlic hits the soup is the hallmark of properly made molokhia.'),
  (rid, 5, 'Serve', 'Ladle the molokhia over white rice in deep plates. Serve the shredded chicken alongside, with lemon wedges and bread.', NULL, NULL, 'Some Egyptians eat molokhia with vermicelli rice and others with plain white rice — both are traditional.');
END $$;

-- =============================================
-- WESTERN SAHARA (EH)
-- =============================================

-- 16. Sahrawi Camel Meat Stew (Western Sahara)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'sahrawi-camel-stew-eh', 'Sahrawi Camel Meat Stew', 'طاجين لحم الإبل', 'A hearty nomadic stew of slow-cooked camel meat with onions, tomatoes, and warming spices. The signature protein of Sahrawi desert cuisine.',
    'EH', 'Western Sahara', 'North Africa', 'Sahrawi', 'stew',
    ARRAY['camel', 'stew', 'sahrawi', 'nomadic', 'desert'],
    ARRAY['gluten-free', 'dairy-free', 'halal'],
    20, 120, 'medium', 6,
    'Camel meat is central to the diet and culture of the Sahrawi people, the nomadic inhabitants of Western Sahara. In the harsh desert environment, camels provide sustenance, transport, and livelihood. This stew represents the resourcefulness of Sahrawi cooking — simple ingredients transformed through slow cooking over low desert fire into a tender, deeply flavoured meal served during gatherings and celebrations.',
    'Gatherings, celebrations', 'Flatbread and Sahrawi mint tea',
    460, 42, 18, 22, 4,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 750, 'g', 'camel meat', 'cut into large cubes', false, 'beef chuck'),
  (rid, 2, NULL, 3, 'large', 'onions', 'sliced', false, NULL),
  (rid, 3, NULL, 3, 'medium', 'tomatoes', 'chopped', false, NULL),
  (rid, 4, NULL, 3, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 5, NULL, 1, 'tsp', 'ground cumin', NULL, false, NULL),
  (rid, 6, NULL, 1, 'tsp', 'ground coriander', NULL, false, NULL),
  (rid, 7, NULL, 2, 'medium', 'potatoes', 'peeled and quartered', false, NULL),
  (rid, 8, NULL, 1, 'whole', 'dried chilli', NULL, true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Brown the meat', 'Heat oil in a heavy pot over medium-high heat. Season the camel meat with salt, cumin, and coriander. Brown on all sides in batches, about 8 minutes total. Set aside.', 480, 'Brown meat', 'Camel meat is lean — do not overcrowd the pot or it will steam instead of searing.'),
  (rid, 2, 'Cook the onions', 'In the same pot, add the sliced onions and cook over medium heat until deeply caramelised, about 12 minutes.', 720, 'Cook onions', 'The caramelised onions provide the sweetness that balances the dish.'),
  (rid, 3, 'Build the stew', 'Return the meat to the pot. Add the chopped tomatoes, dried chilli, and enough water to just cover. Bring to a boil, then reduce to a very low simmer. Cover and cook for 90 minutes.', 5400, 'Slow cook', 'Low and slow is essential — camel meat becomes wonderfully tender with patience.'),
  (rid, 4, 'Add potatoes', 'Add the potatoes and continue cooking for another 25 minutes until the potatoes are tender and the sauce has thickened.', 1500, 'Cook potatoes', NULL),
  (rid, 5, 'Serve', 'Taste and adjust seasoning. Serve in a communal bowl with flatbread for scooping, alongside strong, sweet Sahrawi mint tea.', NULL, NULL, 'In Sahrawi tradition, this is eaten communally from a shared plate.');
END $$;

-- 17. Sahrawi Couscous with Vegetables (Western Sahara)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'sahrawi-couscous-eh', 'Sahrawi Vegetable Couscous', 'كسكسو بالخضار', 'A simple, nourishing Sahrawi couscous steamed with onions, turnips, carrots, and squash in a light broth. Desert cooking at its most pure and satisfying.',
    'EH', 'Western Sahara', 'North Africa', 'Sahrawi', 'main',
    ARRAY['couscous', 'vegetables', 'sahrawi', 'simple', 'one-pot'],
    ARRAY['vegan', 'dairy-free', 'halal'],
    20, 50, 'easy', 6,
    'Couscous is a staple across the Sahrawi diet, prepared more simply than in neighbouring Morocco or Algeria due to the limited ingredients available in the desert environment. Sahrawi women prepare couscous by hand-rolling semolina grains, a skill passed from mother to daughter. This vegetable version is the everyday meal, served family-style on a large communal platter.',
    'Everyday meal', 'Camel milk or buttermilk',
    360, 10, 62, 8, 8,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'medium couscous', NULL, false, NULL),
  (rid, 2, NULL, 2, 'medium', 'carrots', 'peeled and halved lengthwise', false, NULL),
  (rid, 3, NULL, 2, 'medium', 'turnips', 'peeled and quartered', false, NULL),
  (rid, 4, NULL, 300, 'g', 'pumpkin or squash', 'cut into large chunks', false, NULL),
  (rid, 5, NULL, 1, 'large', 'onion', 'quartered', false, NULL),
  (rid, 6, NULL, 2, 'tbsp', 'olive oil', NULL, false, NULL),
  (rid, 7, NULL, 1, 'tsp', 'salt', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Start the vegetable broth', 'Place the onion, carrots, and turnips in the bottom of a couscoussier or large pot. Add 1.5 litres of water, olive oil, and salt. Bring to a boil, then reduce to a simmer.', NULL, NULL, NULL),
  (rid, 2, 'First steam of couscous', 'Moisten the couscous with salted water, raking it with your fingers to separate the grains. Place in the steamer basket over the simmering vegetables. Steam uncovered for 15 minutes.', 900, 'First steam', 'Do not cover the steamer — the steam needs to pass through freely.'),
  (rid, 3, 'Add squash and rest couscous', 'Remove the couscous and spread on a tray. Sprinkle with water and rake again to break clumps. Add the pumpkin to the broth below. Return the couscous to the steamer for a second steam of 15 minutes.', 900, 'Second steam', 'Two steamings give the lightest, most separate grains.'),
  (rid, 4, 'Final steam', 'Repeat the moistening process and steam a third time for 10 minutes. The couscous should be fluffy, light, and each grain separate.', 600, 'Third steam', 'Three steamings is traditional and makes a real difference in texture.'),
  (rid, 5, 'Serve', 'Mound the couscous on a large communal platter. Arrange the vegetables on top and ladle broth over everything. Serve from the shared platter.', NULL, NULL, 'Sahrawi custom is to eat from the edges of the platter, working inward.');
END $$;

-- 18. Sahrawi Mint Tea (Western Sahara)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'sahrawi-mint-tea-eh', 'Sahrawi Mint Tea', 'أتاي', 'A frothy, intensely sweet green tea with fresh mint, poured from height to create a signature foam. Prepared in three rounds, each with its own character and proverb.',
    'EH', 'Western Sahara', 'North Africa', 'Sahrawi', 'drink',
    ARRAY['tea', 'mint', 'sahrawi', 'ceremony', 'desert'],
    ARRAY['vegan', 'gluten-free', 'dairy-free', 'halal'],
    5, 20, 'easy', 4,
    'Tea is the heartbeat of Sahrawi social life. The tea ceremony, called atay, is a sacred ritual of hospitality — refusing tea is considered deeply impolite. It is always served in three rounds: the first is strong and bitter like life, the second is balanced and sweet like love, and the third is gentle and mild like death. The tea master pours from great height to create the coveted froth, a sign of skill and respect for guests.',
    'Daily hospitality, every gathering', 'Dates or peanuts',
    80, 0, 20, 0, 0,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 2, 'tbsp', 'Chinese gunpowder green tea', NULL, false, NULL),
  (rid, 2, NULL, 0.5, 'cup', 'sugar', 'or more to taste', false, NULL),
  (rid, 3, NULL, 1, 'bunch', 'fresh mint', 'large bunch', false, NULL),
  (rid, 4, NULL, 3, 'cups', 'water', 'boiling', false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Rinse the tea', 'Place the green tea in a small teapot. Add a splash of boiling water, swirl, and discard. This removes the bitterness and dust from the leaves.', NULL, NULL, 'This rinse is essential — never skip it.'),
  (rid, 2, 'First brew (strong)', 'Add the boiling water and a third of the sugar to the teapot. Let it steep for 5 minutes. Add some mint leaves and pour from a height into small glasses, then pour back into the pot. Repeat the pouring 3-4 times to create foam.', 300, 'First brew', 'The higher you pour, the better the foam. This takes practice.'),
  (rid, 3, 'Serve first round', 'Pour the first round into the glasses from height, creating a frothy top. This round is the strongest and most bitter. Serve and drink.', NULL, NULL, 'The first glass is said to be bitter like life.'),
  (rid, 4, 'Second and third rounds', 'Add more water, sugar, and fresh mint for the second round. Steep and pour the same way. Repeat for the third round with even more sugar and mint. Each round gets sweeter and milder.', 300, 'Subsequent brews', 'Always accept all three rounds — it is a sign of respect and friendship.'),
  (rid, 5, 'Present with care', 'Serve each glass on a small tray. The tea master always tastes first to ensure quality before serving guests.', NULL, NULL, 'In Sahrawi culture, the youngest person present usually prepares the tea as a sign of respect to elders.');
END $$;

-- =============================================
-- SUDAN (SD)
-- =============================================

-- 19. Ful Medames (Sudan)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'ful-medames-sd', 'Ful Medames', 'فول مدمس', 'Sudan''s beloved slow-cooked fava beans mashed with sesame oil, lemon, and cumin — the undisputed national breakfast dish.',
    'SD', 'Sudan', 'North Africa', 'Arab-Nubian', 'main',
    ARRAY['fava-beans', 'breakfast', 'sudanese', 'comfort-food', 'street-food'],
    ARRAY['vegan', 'gluten-free', 'dairy-free', 'halal'],
    10, 120, 'easy', 6,
    'Ful is the beating heart of Sudanese mornings. From Khartoum street stalls to village homes along the Nile, the day begins with a plate of creamy fava beans drizzled with sesame oil and fresh lemon. Vendors slow-cook the beans overnight in tall, narrow pots called damasa, creating a uniquely smooth texture. Ful is more than food — it is a social ritual, eaten communally with bread torn and shared among friends and neighbours.',
    'Breakfast, any day', 'Warm flatbread (kisra or aish baladi), hard-boiled eggs, fresh salad',
    380, 22, 48, 12, 14,
    true, true
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, NULL, 500, 'g', 'dried fava beans', 'soaked overnight', false, 'canned fava beans'),
  (rid, 2, NULL, 3, 'tbsp', 'sesame oil', NULL, false, 'olive oil'),
  (rid, 3, NULL, 2, 'whole', 'lemons', 'juiced', false, NULL),
  (rid, 4, NULL, 1, 'tsp', 'ground cumin', NULL, false, NULL),
  (rid, 5, NULL, 2, 'cloves', 'garlic', 'minced', true, NULL),
  (rid, 6, NULL, 1, 'small', 'onion', 'finely diced', true, NULL),
  (rid, 7, NULL, 1, 'pinch', 'salt', 'to taste', false, NULL),
  (rid, 8, NULL, 1, 'whole', 'fresh chilli', 'sliced', true, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Cook the beans', 'Drain soaked fava beans, place in a large pot, and cover with fresh water by 5cm. Bring to a boil, reduce to a gentle simmer, cover, and cook for about 2 hours until very soft and breaking apart.', 7200, 'Cook beans', 'The longer and slower you cook, the creamier the result. Some Sudanese cooks simmer overnight on the lowest heat.'),
  (rid, 2, 'Mash and season', 'Drain most of the water, reserving some. Mash the beans roughly with a fork or potato masher — leave some texture. Stir in the cumin, salt, and half the lemon juice.', NULL, NULL, 'Sudanese ful is mashed, not pureed — you want chunky bits.'),
  (rid, 3, 'Garnish and serve', 'Spoon into shallow bowls. Drizzle generously with sesame oil and remaining lemon juice. Top with diced onion, minced garlic, and sliced chilli. Serve immediately with warm bread.', NULL, NULL, 'In Sudan, the sesame oil is key — it gives ful its distinctive nutty flavour that sets it apart from Egyptian versions.');
END $$;

-- 20. Kisra with Mullah (Sudan)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'kisra-mullah-sd', 'Kisra with Mullah Tagalia', 'كسرة مع ملاح تقلية', 'Thin, fermented sorghum crepes (kisra) served with Sudan''s aromatic dried meat and onion stew — the daily meal of millions.',
    'SD', 'Sudan', 'North Africa', 'Arab-Nubian', 'main',
    ARRAY['kisra', 'flatbread', 'fermented', 'stew', 'sudanese', 'sorghum'],
    ARRAY['dairy-free', 'halal'],
    30, 45, 'medium', 6,
    'Kisra is to Sudan what injera is to Ethiopia — the essential bread that defines the cuisine. Made from fermented sorghum batter, it is cooked paper-thin on a wide, hot plate. Mullah tagalia is a robust stew built on dried meat (sharmout), caramelised onions, and peanut butter, creating layers of smoky, nutty, and savoury flavours. Together, they form the foundational meal of Sudanese home cooking.',
    'Daily family lunch or dinner', 'Salata aswad (peanut and tomato salad)',
    520, 32, 58, 18, 6,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Kisra', 2, 'cups', 'sorghum flour', NULL, false, 'millet flour'),
  (rid, 2, 'Kisra', 2, 'cups', 'water', 'warm', false, NULL),
  (rid, 3, 'Kisra', 0.25, 'tsp', 'yeast', 'or use natural fermentation', true, NULL),
  (rid, 4, 'Mullah', 250, 'g', 'dried beef (sharmout)', 'pounded and shredded', false, 'fresh beef stew meat'),
  (rid, 5, 'Mullah', 4, 'large', 'onions', 'thinly sliced', false, NULL),
  (rid, 6, 'Mullah', 3, 'tbsp', 'peanut butter', 'natural, unsweetened', false, NULL),
  (rid, 7, 'Mullah', 3, 'tbsp', 'vegetable oil', NULL, false, NULL),
  (rid, 8, 'Mullah', 2, 'medium', 'tomatoes', 'chopped', false, NULL),
  (rid, 9, 'Mullah', 1, 'tsp', 'ground coriander', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Prepare kisra batter', 'Mix sorghum flour with warm water and a pinch of yeast to form a thin, pourable batter (thinner than crepe batter). Cover and let ferment at room temperature for 12-24 hours until slightly sour.', NULL, NULL, 'Traditional fermentation uses no yeast — just time. The natural bacteria create the sour tang.'),
  (rid, 2, 'Cook the kisra', 'Heat a large flat pan or griddle (doka). Pour a thin layer of batter and quickly spread it in a circular motion using a palette or the back of a spoon. Cook until set and edges lift, about 1 minute. Do not flip — kisra is cooked on one side only.', NULL, NULL, 'Sudanese women are expert at spreading kisra paper-thin with a special gourd tool called a mafrash.'),
  (rid, 3, 'Build the mullah', 'Heat oil in a deep pot. Fry the onions over medium heat, stirring often, until deeply caramelised and dark brown, about 20 minutes. Add the dried meat, tomatoes, coriander, and 2 cups of water. Simmer for 20 minutes.', 1200, 'Caramelise onions', 'The dark onions are the soul of tagalia — don''t rush this step.'),
  (rid, 4, 'Add peanut butter', 'Stir in the peanut butter until fully dissolved. Simmer for another 10 minutes until the stew is thick and rich. Season with salt.', 600, 'Finish stew', 'The peanut butter thickens the stew and adds a nutty depth.'),
  (rid, 5, 'Serve', 'Lay kisra on a large platter or individual plates. Ladle the mullah over the top. Eat by tearing pieces of kisra and scooping the stew.', NULL, NULL, 'In Sudanese tradition, everyone eats from one large shared platter.');
END $$;

-- 21. Basbousa (Sudan)
DO $$
DECLARE rid UUID;
BEGIN
  INSERT INTO recipes (slug, name, name_local, description, country_code, country_name, region, ethnic_group, category, tags, diet_tags, prep_time_minutes, cook_time_minutes, difficulty, default_servings, story, occasion, best_served_with, calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_featured)
  VALUES (
    'basbousa-sd', 'Basbousa', 'بسبوسة', 'A sweet, syrup-soaked semolina cake scented with rose water and topped with almonds — Sudan''s favourite celebratory dessert.',
    'SD', 'Sudan', 'North Africa', 'Arab-Nubian', 'dessert',
    ARRAY['semolina', 'cake', 'syrup', 'sudanese', 'rose-water', 'celebration'],
    ARRAY['vegetarian', 'halal'],
    15, 30, 'easy', 12,
    'Basbousa is the dessert that marks every Sudanese celebration, from Eid feasts to weddings and births. The semolina gives it a unique grainy texture that absorbs the fragrant sugar syrup like a sponge. Every household has a slightly different recipe, but the rose water-scented syrup poured over the hot cake is the constant. The diamond-shaped cuts with an almond on each piece make basbousa as beautiful as it is delicious.',
    'Eid, weddings, celebrations', 'Sudanese coffee (jabana) or tea with milk',
    290, 4, 42, 12, 1,
    true, false
  ) RETURNING id INTO rid;

  INSERT INTO recipe_ingredients (recipe_id, sort_order, group_name, amount, unit, name, prep_note, is_optional, substitution) VALUES
  (rid, 1, 'Cake', 2, 'cups', 'fine semolina', NULL, false, NULL),
  (rid, 2, 'Cake', 1, 'cup', 'sugar', NULL, false, NULL),
  (rid, 3, 'Cake', 1, 'cup', 'yoghurt', 'plain, full-fat', false, NULL),
  (rid, 4, 'Cake', 0.5, 'cup', 'melted butter', NULL, false, 'ghee'),
  (rid, 5, 'Cake', 1, 'tsp', 'baking powder', NULL, false, NULL),
  (rid, 6, 'Cake', 0.5, 'cup', 'desiccated coconut', NULL, true, NULL),
  (rid, 7, 'Cake', 12, 'whole', 'blanched almonds', 'for topping', false, NULL),
  (rid, 8, 'Syrup', 1.5, 'cups', 'sugar', NULL, false, NULL),
  (rid, 9, 'Syrup', 1, 'cup', 'water', NULL, false, NULL),
  (rid, 10, 'Syrup', 1, 'tbsp', 'rose water', NULL, false, 'orange blossom water'),
  (rid, 11, 'Syrup', 1, 'squeeze', 'lemon juice', NULL, false, NULL);

  INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, timer_seconds, timer_label, tip) VALUES
  (rid, 1, 'Make the syrup', 'Combine 1.5 cups sugar and 1 cup water in a saucepan. Bring to a boil, add lemon juice, and simmer for 8 minutes until slightly thickened. Stir in rose water and set aside to cool completely.', 480, 'Syrup', 'The syrup MUST be cold when poured on the hot cake — this is the secret to proper absorption.'),
  (rid, 2, 'Mix the batter', 'Combine the semolina, 1 cup sugar, yoghurt, melted butter, baking powder, and coconut. Mix well and let rest for 30 minutes so the semolina absorbs the moisture.', 1800, 'Rest batter', 'Resting is essential — it softens the semolina for a smoother cake.'),
  (rid, 3, 'Bake', 'Preheat oven to 180°C (350°F). Spread the batter evenly in a greased 23×33cm baking dish. Score into diamond shapes and press an almond into each piece. Bake for 25-30 minutes until golden.', 1800, 'Bake', 'Score before baking so the syrup penetrates deeply into each piece.'),
  (rid, 4, 'Soak with syrup', 'Remove the hot cake from the oven and immediately pour the cold syrup evenly over the entire surface. Let it sit for at least 30 minutes to absorb.', 1800, 'Absorb syrup', 'You will hear the satisfying sizzle when the cold syrup hits the hot cake.'),
  (rid, 5, 'Serve', 'Re-cut along the scored lines and serve at room temperature. Basbousa keeps well covered at room temperature for 2-3 days.', NULL, NULL, 'In Sudan, basbousa is always served with strong coffee or sweet tea with milk.');
END $$;
